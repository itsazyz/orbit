'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface MusicPickerProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  musicUrl: string;
  onMusicUrlChange: (url: string) => void;
  volume?: number;
}

export function MusicPicker({
  enabled,
  onEnabledChange,
  musicUrl,
  onMusicUrlChange,
  volume = 0.3,
}: MusicPickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  async function handleFileSelect(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Please choose an audio file (MP3, WAV, OGG…).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('File must be 8 MB or smaller.');
      return;
    }

    setError('');
    setUploading(true);
    setFileName(file.name);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Sign in to upload music.');
        return;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('planet-music')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('planet-music').getPublicUrl(path);
      onMusicUrlChange(data.publicUrl);
      onEnabledChange(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
          color: '#b7bdd1',
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
        <span>Play background music for visitors (30% volume)</span>
      </label>

      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid rgba(167,139,250,0.4)',
            background: 'rgba(124,58,237,0.2)',
            color: 'white',
            cursor: uploading ? 'wait' : 'pointer',
            fontSize: 14,
          }}
        >
          {uploading ? 'Uploading…' : 'Choose a song from your device'}
        </button>

        {fileName ? (
          <span style={{ color: '#9da6c2', fontSize: 13 }}>{fileName}</span>
        ) : null}
      </div>

      {musicUrl ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ color: '#9da6c2', fontSize: 12, margin: '0 0 8px' }}>Preview:</p>
          <audio
            ref={audioRef}
            controls
            src={musicUrl}
            style={{ width: '100%' }}
            onLoadedMetadata={() => {
              if (audioRef.current) audioRef.current.volume = volume;
            }}
          />
        </div>
      ) : null}

      <p style={{ color: '#68718c', fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
        Or paste a direct link to an MP3:
      </p>
      <input
        value={musicUrl}
        onChange={(e) => {
          onMusicUrlChange(e.target.value);
          if (e.target.value.trim()) onEnabledChange(true);
        }}
        placeholder="https://example.com/your-song.mp3"
        style={{
          width: '100%',
          padding: 14,
          marginTop: 6,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(0,0,0,0.25)',
          color: 'white',
          fontSize: 14,
          boxSizing: 'border-box',
        }}
      />

      {error ? <p style={{ color: '#fca5a5', fontSize: 13, marginTop: 8 }}>{error}</p> : null}
    </div>
  );
}
