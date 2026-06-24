import {
  Invitation,
  Inviter,
  Messager,
  Registerer,
  RegistererState,
  SessionState,
  UserAgent,
  type InvitationAcceptOptions,
  type InviterOptions,
  type Message,
  type Session,
  type SessionInviteOptions,
  type UserAgentDelegate,
} from "sip.js";
import type { SessionDescriptionHandler, SessionDescriptionHandlerOptions } from "sip.js/lib/platform/web";

export interface PhoneUserDelegate {
  onCallCreated?: () => void;
  onCallAnswered?: () => void;
  onCallHangup?: () => void;
  onCallHold?: (held: boolean) => void;
  onCallReceived?: (remoteUser: string) => void;
  onMessageReceived?: (body: string, from: string) => void;
  onRegistered?: () => void;
  onUnregistered?: () => void;
  onServerConnect?: () => void;
  onServerDisconnect?: (error?: Error) => void;
}

export interface PhoneUserOptions {
  server: string;
  aor: string;
  delegate?: PhoneUserDelegate;
  media?: {
    remote?: { audio?: HTMLAudioElement };
  };
  credentials?: {
    username?: string;
    password?: string;
  };
  displayName?: string;
}

export class PhoneUser {
  public delegate?: PhoneUserDelegate;
  public session: Session | undefined;

  private options: PhoneUserOptions;
  private userAgent: UserAgent;
  private registerer: Registerer | undefined;

  private _isHeld: boolean = false;
  private _isMuted: boolean = false;

  constructor(options: PhoneUserOptions) {
    this.options = options;
    this.delegate = options.delegate;

    const uri = UserAgent.makeURI(options.aor);
    if (!uri) throw new Error("Invalid AOR");

    const delegate: UserAgentDelegate = {
      onConnect: () => this.delegate?.onServerConnect?.(),
      onDisconnect: (error) => this.delegate?.onServerDisconnect?.(error),
      onMessage: (message: Message) => {
        const from =
          message.request.from.uri.user || message.request.from.uri.host;
        this.delegate?.onMessageReceived?.(message.request.body || "", from);
        message.accept();
      },
      onInvite: (invitation: Invitation) => {
        if (this.session) {
          invitation.reject();
          return;
        }
        this.session = invitation;
        this.setupSessionListeners(this.session);

        const remoteUser = invitation.remoteIdentity.uri.user || "Unknown";
        this.delegate?.onCallReceived?.(remoteUser);
      },
    };

    this.userAgent = new UserAgent({
      uri,
      authorizationUsername: options.credentials?.username,
      authorizationPassword: options.credentials?.password,
      displayName: options.displayName,
      transportOptions: { server: options.server },
      delegate,
    });

    this.registerer = new Registerer(this.userAgent);
    this.registerer.stateChange.addListener((state) => {
      if (state === RegistererState.Registered) this.delegate?.onRegistered?.();
      else if (state === RegistererState.Unregistered)
        this.delegate?.onUnregistered?.();
    });
  }

  private setupSessionListeners(session: Session) {
    session.stateChange.addListener((state: SessionState) => {
      if (state === SessionState.Established) {
        this._isHeld = false;
        this.setupRemoteMedia();
        this.delegate?.onCallAnswered?.();
      } else if (
        state === SessionState.Terminating ||
        state === SessionState.Terminated
      ) {
        if (this.session === session) {
          this.session = undefined;
          this.delegate?.onCallHangup?.();
        }
      }
    });
  }

  private setupRemoteMedia() {
    if (!this.session) return;
    const sdh = this.session
      .sessionDescriptionHandler as SessionDescriptionHandler;
    if (!sdh) return;
    const remoteStream = sdh.remoteMediaStream;
    const audioElement = this.options.media?.remote?.audio;
    if (remoteStream && audioElement) {
      audioElement.srcObject = remoteStream;
      audioElement.play().catch((e) => console.error("Audio play failed", e));
    }
  }

  public async connect(): Promise<void> {
    await this.userAgent.start();
  }

  public async disconnect(): Promise<void> {
    await this.userAgent.stop();
  }

  public async register(): Promise<void> {
    if (!this.registerer) throw new Error("No registerer");
    await this.registerer.register();
  }

  public async unregister(): Promise<void> {
    if (!this.registerer) throw new Error("No registerer");
    await this.registerer.unregister();
  }

  public async call(
    destination: string,
    inviterOptions?: InviterOptions,
  ): Promise<void> {
    if (this.session) {
      return Promise.reject(new Error("Session already exists."));
    }
    const targetURI = UserAgent.makeURI(destination);
    if (!targetURI) {
      return Promise.reject(new Error("Invalid destination URI."));
    }

    const options: InviterOptions = inviterOptions || {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    };

    this.session = new Inviter(this.userAgent, targetURI);
    this.setupSessionListeners(this.session);
    this.delegate?.onCallCreated?.();

    await (this.session as Inviter).invite(options);
  }

  public async answer(
    invitationAcceptOptions?: InvitationAcceptOptions,
  ): Promise<void> {
    if (!this.session || !(this.session instanceof Invitation)) {
      return Promise.reject(new Error("No incoming session to answer."));
    }
    const options: InvitationAcceptOptions = invitationAcceptOptions || {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    };
    return this.session.accept(options);
  }

  public async decline(): Promise<void> {
    if (!this.session || !(this.session instanceof Invitation)) {
      return Promise.reject(new Error("No incoming session to decline."));
    }
    return this.session.reject();
  }

  public async hangup(): Promise<void> {
    if (!this.session)
      return Promise.reject(new Error("Session does not exist."));

    const state = this.session.state;
    if (state === SessionState.Established) {
      await this.session.bye();
    } else if (
      state === SessionState.Establishing ||
      state === SessionState.Initial
    ) {
      if (this.session instanceof Inviter) {
        await this.session.cancel();
      } else if (this.session instanceof Invitation) {
        await this.session.reject();
      }
    }
  }

  public async hold(): Promise<void> {
    if (!this.session) return Promise.reject(new Error("No session"));
    const options: SessionInviteOptions = {
      sessionDescriptionHandlerOptions: { hold: true } as SessionDescriptionHandlerOptions,
    };
    await this.session.invite(options);
    this._isHeld = true;
    this.delegate?.onCallHold?.(this._isHeld);
  }

  public async unhold(): Promise<void> {
    if (!this.session) return Promise.reject(new Error("No session"));
    const options: SessionInviteOptions = {
      sessionDescriptionHandlerOptions: { hold: false } as SessionDescriptionHandlerOptions,
    };
    await this.session.invite(options);
    this._isHeld = false;
    this.delegate?.onCallHold?.(this._isHeld);
  }

  public isHeld(): boolean {
    return this._isHeld;
  }

  public mute(): void {
    if (!this.session) return;
    const sdh = this.session
      .sessionDescriptionHandler as SessionDescriptionHandler;
    if (!sdh || !sdh.peerConnection) return;
    sdh.peerConnection.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === "audio")
        sender.track.enabled = false;
    });
    this._isMuted = true;
  }

  public unmute(): void {
    if (!this.session) return;
    const sdh = this.session
      .sessionDescriptionHandler as SessionDescriptionHandler;
    if (!sdh || !sdh.peerConnection) return;
    sdh.peerConnection.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === "audio")
        sender.track.enabled = true;
    });
    this._isMuted = false;
  }

  public isMuted(): boolean {
    return this._isMuted;
  }

  public sendDTMF(tone: string): Promise<void> {
    if (!this.session) return Promise.reject(new Error("No session"));
    const sdh = this.session
      .sessionDescriptionHandler as SessionDescriptionHandler;
    if (sdh && sdh.sendDtmf) {
      sdh.sendDtmf(tone);
      return Promise.resolve();
    }
    return Promise.reject(new Error("DTMF not supported"));
  }

  public async message(destination: string, message: string): Promise<void> {
    const targetURI = UserAgent.makeURI(destination);
    if (!targetURI)
      return Promise.reject(new Error("Invalid destination URI."));

    const messager = new Messager(this.userAgent, targetURI, message);
    await messager.message();
  }
}
