import { TrackPlayerModule } from './TrackPlayerModule';

let moduleInstance: TrackPlayerModule | null = null;

function getTrackPlayer(): TrackPlayerModule {
  if (!moduleInstance && typeof window !== 'undefined') {
    moduleInstance = new TrackPlayerModule();
  }
  if (!moduleInstance) {
    // Create a stub instance for SSR that will be replaced on client
    moduleInstance = new TrackPlayerModule();
  }
  return moduleInstance;
}

// Don't call getTrackPlayer() immediately - export the result of calling it lazily
export default getTrackPlayer();
