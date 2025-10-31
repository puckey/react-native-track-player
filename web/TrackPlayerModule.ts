import { DeviceEventEmitter } from 'react-native';

import type {
  PlaybackErrorEvent,
  RepeatMode as RepeatModeType,
} from '../src/features';
import { State } from './TrackPlayer/State';
import { Event } from './TrackPlayer/Event';

import type { Spec } from '../src/NativeTrackPlayer';
import type {
  Options,
  PlaybackProgressUpdatedEvent,
  PlaybackQueueEndedEvent,
  PlaybackState,
  PlayingState,
  RepeatModeChangedEvent,
  Track,
  UpdateOptions,
} from '../src/features';
import { PlaylistPlayer, RepeatMode } from './TrackPlayer';
import { SetupNotCalledError } from './TrackPlayer/SetupNotCalledError';

export class TrackPlayerModule extends PlaylistPlayer implements Spec {
  protected emitter = DeviceEventEmitter;
  protected progressUpdateEventInterval: NodeJS.Timeout | undefined;
  protected options: Options = {
    forwardJumpInterval: 15,
    backwardJumpInterval: 15,
    progressUpdateEventInterval: null,
    repeatMode: RepeatMode.Off,
    capabilities: [], // irrelevant in web-world
  };

  private addStubListener() {
    return this.emitter.addListener('_', () => {});
  }

  // observe and emit state changes
  protected get state(): PlaybackState {
    return super.state;
  }
  protected set state(newState: PlaybackState) {
    const didStateChange = newState.state !== super.state.state;
    const didErrorChange =
      newState.state === State.Error && super.state.state === State.Error
        ? newState.error === super.state.error
        : false;

    super.state = newState;

    if (!didStateChange && !didErrorChange) {
      return;
    }

    // emit stage change events
    this.emitter.emit(Event.PlaybackState, newState);
    if (newState.state === State.Error) {
      const event: PlaybackErrorEvent = {
        error: newState.error.error,
      };
      this.emitter.emit(Event.PlaybackError, event);
    }
  }

  protected setupProgressUpdates(interval?: number) {
    // clear and reset interval
    this.clearUpdateEventInterval();
    if (interval) {
      this.clearUpdateEventInterval();
      this.progressUpdateEventInterval = setInterval(() => {
        if (this.state.state === State.Playing) {
          const progress = this.getProgress();
          const event: PlaybackProgressUpdatedEvent = {
            ...progress,
            track: this.currentIndex || 0,
          };
          this.emitter.emit(Event.PlaybackProgressUpdated, event);
        }
      }, interval * 1000);
    }
  }

  protected clearUpdateEventInterval() {
    if (this.progressUpdateEventInterval) {
      clearInterval(this.progressUpdateEventInterval);
    }
  }

  protected onPlaylistEnded() {
    super.onPlaylistEnded();
    this.emitter.emit(Event.PlaybackQueueEnded, {
      track: this.currentIndex ?? 0,
      position: this.element!.currentTime,
    });
  }

  /****************************************
   * MARK: init and config
   ****************************************/
  // setupPlayer is inherited from Player

  public updateOptions(options: UpdateOptions) {
    this.options = {
      ...this.options,
      ...(options as Omit<UpdateOptions, 'android' | 'ios'>),
    };
    this.setupProgressUpdates(options.progressUpdateEventInterval);
    this.emitter.emit(Event.PlaybackOptionsChanged, options);
  }

  public getOptions() {
    return this.options;
  }

  /****************************************
   * MARK: events
   ****************************************/
  public onAndroidControllerConnected() {
    return this.addStubListener();
  }
  public onAndroidControllerDisconnected() {
    return this.addStubListener();
  }
  public onMetadataChapterReceived() {
    return this.addStubListener();
  }
  public onMetadataCommonReceived() {
    return this.addStubListener();
  }
  public onMetadataTimedReceived() {
    return this.addStubListener();
  }

  public onPlaybackActiveTrackChanged(callback: (event: object) => void) {
    return this.emitter.addListener(Event.PlaybackActiveTrackChanged, callback);
  }

  public onPlaybackError(callback: (event: { error?: unknown }) => void) {
    return this.emitter.addListener(Event.PlaybackError, callback);
  }

  public onPlaybackMetadata() {
    return this.addStubListener();
  }

  public onPlaybackPlayWhenReadyChanged(
    callback: (event: { playWhenReady: boolean }) => void,
  ) {
    return this.emitter.addListener(
      Event.PlaybackPlayWhenReadyChanged,
      callback,
    );
  }

  public onPlaybackPlayingState(callback: (state: PlayingState) => void) {
    return this.emitter.addListener(
      Event.PlaybackState,
      (state: PlaybackState) => {
        return callback(this.getPlayingState(state));
      },
    );
  }

  public onPlaybackProgressUpdated(
    callback: (event: PlaybackProgressUpdatedEvent) => void,
  ) {
    return this.emitter.addListener(Event.PlaybackProgressUpdated, callback);
  }

  public onPlaybackQueueEnded(
    callback: (event: PlaybackQueueEndedEvent) => void,
  ) {
    return this.emitter.addListener(Event.PlaybackQueueEnded, callback);
  }

  public onPlaybackRepeatModeChanged(
    callback: (event: RepeatModeChangedEvent) => void,
  ) {
    return this.emitter.addListener(Event.PlaybackRepeatModeChanged, callback);
  }

  public onPlaybackState(callback: (state: PlaybackState) => void) {
    return this.emitter.addListener(Event.PlaybackState, callback);
  }

  public onRemoteBookmark() {
    return this.addStubListener();
  }
  public onRemoteDislike() {
    return this.addStubListener();
  }
  public onRemoteJumpBackward() {
    return this.addStubListener();
  }
  public onRemoteJumpForward() {
    return this.addStubListener();
  }
  public onRemoteLike() {
    return this.addStubListener();
  }
  public onRemoteNext() {
    return this.addStubListener();
  }
  public onRemotePause() {
    return this.addStubListener();
  }
  public onRemotePlay() {
    return this.addStubListener();
  }
  public onRemotePlayId() {
    return this.addStubListener();
  }
  public onRemotePlaySearch() {
    return this.addStubListener();
  }
  public onRemotePrevious() {
    return this.addStubListener();
  }
  public onRemoteSeek() {
    return this.addStubListener();
  }
  public onRemoteSetRating() {
    return this.addStubListener();
  }
  public onRemoteSkip() {
    return this.addStubListener();
  }
  public onRemoteStop() {
    return this.addStubListener();
  }

  public onOptionsChanged(callback: (event: Options) => void) {
    return this.emitter.addListener(Event.PlaybackOptionsChanged, callback);
  }

  /****************************************
   * MARK: player api
   ****************************************/
  public load(track: Track, onComplete?: (track: Track) => void) {
    if (!this.element) throw new SetupNotCalledError();
    const lastTrack = this.current;
    const lastPosition = this.element.currentTime;
    super.load(track, () => {
      onComplete?.(track);
      this.emitter.emit(Event.PlaybackActiveTrackChanged, {
        lastTrack,
        lastPosition,
        lastIndex: this.lastIndex,
        index: this.currentIndex,
        track,
      });
    });
  }

  // reset is inherited from PlaylistPlayer

  // play is inherited from Player

  // pause is inherited from Player

  public togglePlayback() {
    return super.togglePlayback();
  }

  // stop is inherited from PlaylistPlayer

  public setPlayWhenReady(pwr: boolean) {
    const didChange = pwr !== this._playWhenReady;
    super.playWhenReady = pwr;

    if (didChange) {
      this.emitter.emit(Event.PlaybackPlayWhenReadyChanged, {
        playWhenReady: this._playWhenReady,
      });
    }

    return super.playWhenReady;
  }

  public getPlayWhenReady(): boolean {
    return super.playWhenReady;
  }

  // seekTo is inherited from Player

  // seekBy is inherited from Player

  // setVolume is inherited from Player

  // getVolume is inherited from Player

  // setRate is inherited from Player

  // getRate is inherited from Player

  // getProgress is inherited from Player

  public getPlaybackState(): PlaybackState {
    return this.state;
  }

  public getPlayingState(state?: PlaybackState): PlayingState {
    const curState = state ? state.state : this.state.state;
    return {
      playing: curState === State.Playing,
      buffering: curState === State.Buffering,
    };
  }

  public getRepeatMode() {
    return super.getRepeatMode();
  }

  public setRepeatMode(mode: RepeatModeType) {
    const didChange = this.repeatMode !== mode;
    super.setRepeatMode(mode);

    if (didChange) {
      this.emitter.emit(Event.PlaybackRepeatModeChanged, {
        repeatMode: mode,
      });
    }
  }

  public getPlaybackError() {
    if (this.state.state === State.Error) {
      return this.state.error?.error || null;
    }
    return null;
  }

  // retry is inherited from Player

  /****************************************
   * MARK: playlist management
   ****************************************/
  // add is inherited from PlaylistPlayer

  // move is inherited from PlaylistPlayer

  // remove is inherited from PlaylistPlayer

  // removeUpcomingTracks is inherited from PlaylistPlayer

  // skip is inherited from PlaylistPlayer

  // skipToNext is inherited from PlaylistPlayer

  // skipToPrevious is inherited from PlaylistPlayer

  // updateMetadataForTrack is inherited from PlaylistPlayer

  // updateNowPlayingMetadata is inherited from PlaylistPlayer

  public setQueue(queue: Track[]) {
    this.stop();
    this.playlist = queue;
    if (queue.length) {
      this.skip(0);
    }
  }

  public getQueue(): Track[] {
    return this.playlist;
  }

  // getTrack is inherited from PlaylistPlayer

  public getActiveTrackIndex(): number | undefined {
    // per the existing spec, this should throw if setup hasn't been called
    if (!this.element || !this.player) throw new SetupNotCalledError();
    return this.currentIndex;
  }

  public getActiveTrack(): Track | undefined {
    return this.current;
  }

  /****************************************
   * MARK: Android methods
   ****************************************/
  public acquireWakeLock() {}
  public abandonWakeLock() {}

  /****************************************
   * MARK: Media Browser Methods
   ****************************************/
  public onGetItemRequest() {
    return this.addStubListener();
  }
  public resolveGetItemRequest() {}
  public onGetChildrenRequest() {
    return this.addStubListener();
  }
  public resolveGetChildrenRequest() {}
  public onGetSearchResultRequest() {
    return this.addStubListener();
  }
  public resolveSearchResultRequest() {}
  public setMediaBrowserReady() {}
}
