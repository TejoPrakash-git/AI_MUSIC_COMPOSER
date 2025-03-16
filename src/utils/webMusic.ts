export const searchTracks = async (query: string): Promise<WebTrack[]> => {
  // Using Free Music Archive API for demonstration
  const tracks = [
    {
      id: '1',
      title: 'Ambient Piano',
      artist: 'John Smith',
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Impact/Kevin_MacLeod_-_Impact_Prelude.mp3',
      duration: '3:24'
    },
    {
      id: '2',
      title: 'Electronic Dreams',
      artist: 'Sarah Johnson',
      url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bab.mp3',
      duration: '3:15'
    },
    {
      id: '3',
      title: 'Jazz Cafe',
      artist: 'Mike Wilson',
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3',
      duration: '4:15'
    }
  ];

  return tracks.filter(track => 
    track.title.toLowerCase().includes(query.toLowerCase()) ||
    track.artist.toLowerCase().includes(query.toLowerCase())
  );
};