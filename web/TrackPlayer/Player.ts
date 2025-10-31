import { State } from './State';
import type {
  PlaybackState,
  Progress,
  Track,
  State as StateType,
} from '../../src/features';
import { SetupNotCalledError } from './SetupNotCalledError';
import type shaka from 'shaka-player/dist/shaka-player.ui';

export class Player {
  protected hasInitialized = false;
  protected element?: HTMLMediaElement;
  protected player?: shaka.Player;
  protected _current?: Track = undefined;
  protected _playWhenReady = false;
  protected _state: PlaybackState = { state: State.None };

  // current getter/setter
  public get current(): Track | undefined {
    return this._current;
  }
  public set current(cur: Track | undefined) {
    this._current = cur;
  }

  // state getter/setter
  protected get state(): PlaybackState {
    return this._state;
  }
  protected set state(newState: PlaybackState) {
    this._state = newState;
  }

  // playWhenReady getter/setter
  public get playWhenReady(): boolean {
    return this._playWhenReady;
  }
  public set playWhenReady(pwr: boolean) {
    this._playWhenReady = pwr;
  }

  async setupPlayer() {
    // shaka only runs in a browser
    if (typeof window === 'undefined') return;
    if (this.hasInitialized === true) {
      // TODO: double check the structure of this error message
      throw {
        code: 'player_already_initialized',
        message: 'The player has already been initialized via setupPlayer.',
      };
    }

    // @ts-ignore
    const shaka = (await import('shaka-player/dist/shaka-player.ui')).default;
    // Install built-in polyfills to patch browser incompatibilities.
    shaka.polyfill.installAll();
    // Check to see if the browser supports the basic APIs Shaka needs.
    if (!shaka.Player.isBrowserSupported()) {
      // This browser does not have the minimum set of APIs we need.
      this.state = {
        state: State.Error,
        error: {
          error: {
            code: 'not_supported',
            message: 'Browser not supported...',
          },
        },
      };
      throw new Error('Browser not supported.');
    }

    // build dom element and attach shaka-player
    this.element = document.createElement('audio');
    this.element.setAttribute('id', 'react-native-track-player');
    document.body.appendChild(this.element);
    this.player = new shaka.Player();
    this.player?.attach(this.element);

    // Listen for relevant events events.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.player!.addEventListener('error', (error: any) => {
      // Extract the shaka.util.Error object from the event.
      this.onError(error.detail);
    });
    this.element.addEventListener(
      'ended',
      this.onStateUpdate.bind(this, State.Ended),
    );
    this.element.addEventListener(
      'playing',
      this.onStateUpdate.bind(this, State.Playing),
    );
    this.element.addEventListener(
      'pause',
      this.onStateUpdate.bind(this, State.Paused),
    );
    this.player!.addEventListener(
      'loading',
      this.onStateUpdate.bind(this, State.Loading),
    );
    this.player!.addEventListener(
      'loaded',
      this.onStateUpdate.bind(this, State.Ready),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.player!.addEventListener('buffering', ({ buffering }: any) => {
      if (buffering === true) {
        this.onStateUpdate(State.Buffering);
      } else {
        this.onStateUpdate(State.Ready);
      }
    });

    // Attach player to the window to make it easy to access in the JS console.
    // @ts-ignore
    window.rntp = this.player;
    this.hasInitialized = true;
  }

  /**
   * event handlers
   */
  protected onStateUpdate(state: Exclude<StateType, 'error'>) {
    this.state = { state };
  }

  protected onError(error: { code: number; message: string }) {
    // unload the current track to allow for clean playback on other
    this.player?.unload();
    this.state = {
      state: State.Error,
      error: {
        error: {
          code: error.code.toString(),
          message: error.message,
        },
      },
    };

    // Log the error.
    console.debug('Error code', error.code, 'object', error);
  }

  /**
   * NOTE: this method is sync despite the actual load being async. This
   * behavior is intentional as it mirrors what happens in Android. State
   * changes should be captured by event listeners.
   */
  public load(track: Track, onComplete?: (track: Track) => void) {
    if (!this.player) throw new SetupNotCalledError();
    this.player.load(track.url as string).then(() => {
      this.current = track;
      onComplete?.(track);
    });
  }

  /**
   * NOTE: this method is sync despite the actual load being async. This
   * behavior is intentional as it mirrors what happens in Android. State
   * changes should be captured by event listeners.
   */
  public stop(onComplete?: () => void) {
    if (!this.player) throw new SetupNotCalledError();
    this.current = undefined;
    this.player.unload().then(() => onComplete?.());
  }

  /**
   * NOTE: this method is sync despite the actual load being async. This
   * behavior is intentional as it mirrors what happens in Android. State
   * changes should be captured by event listeners.
   */
  public play() {
    if (!this.element) throw new SetupNotCalledError();
    this.playWhenReady = true;
    this.element.play().catch((err: unknown) => console.error(err));
  }

  public retry() {
    if (!this.player) throw new SetupNotCalledError();
    this.player.retryStreaming();
  }

  public pause() {
    if (!this.element) throw new SetupNotCalledError();
    this.playWhenReady = false;
    this.element.pause();
  }

  public togglePlayback() {
    if (!this.element) throw new SetupNotCalledError();
    if (this.playWhenReady) {
      return this.pause();
    } else {
      return this.play();
    }
  }

  public setRate(rate: number) {
    if (!this.element) throw new SetupNotCalledError();
    this.element.defaultPlaybackRate = rate;
    return (this.element.playbackRate = rate);
  }

  public getRate() {
    if (!this.element) throw new SetupNotCalledError();
    return this.element.playbackRate;
  }

  public seekBy(offset: number) {
    if (!this.element) throw new SetupNotCalledError();
    this.element.currentTime += offset;
  }

  public seekTo(seconds: number) {
    if (!this.element) throw new SetupNotCalledError();
    this.element.currentTime = seconds;
  }

  public setVolume(volume: number) {
    if (!this.element) throw new SetupNotCalledError();
    this.element.volume = volume;
  }

  public getVolume() {
    if (!this.element) throw new SetupNotCalledError();
    return this.element.volume;
  }

  public getProgress(): Progress {
    if (!this.element) throw new SetupNotCalledError();
    return {
      position: this.element.currentTime,
      duration: this.element.duration || 0,
      buffered: 0, // TODO: this.element.buffered.end,
    };
  }
}
