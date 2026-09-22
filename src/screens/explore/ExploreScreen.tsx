import React from 'react';
import { VideoFeedScreen } from '../video/VideoFeedScreen';

/**
 * Explore is the videos creators have published: a full-screen, swipe-up feed.
 * (It used to show the same live-stream grid as the Live tab.) Live streams
 * stay on the Live tab.
 */
export function ExploreScreen() {
  return <VideoFeedScreen embedded />;
}
