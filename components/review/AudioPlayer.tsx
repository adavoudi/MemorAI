"use client";

import { useState, useRef, useEffect } from "react";
import { Flex, Button, Icon, SliderField, View } from "@aws-amplify/ui-react";
import { MdPlayArrow, MdPause, MdReplay10, MdForward10 } from "react-icons/md";

interface AudioPlayerProps {
  audioSrc: string;
  // Callback to report the current time to the parent page
  onTimeUpdate: (time: number) => void;
  // Callback to report when the audio has finished playing
  onEnded: () => void;
}

export default function AudioPlayer({
  audioSrc,
  onTimeUpdate,
  onEnded,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => setDuration(audio.duration);
    const handleTimeUpdate = () => {
      const newTime = audio.currentTime;
      setCurrentTime(newTime);
      onTimeUpdate(newTime); // Report time up to the parent
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded(); // Report that playback finished
    };

    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    // Cleanup listeners
    return () => {
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onTimeUpdate, onEnded]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        audioRef.current.currentTime + amount
      );
    }
  };

  const handleSliderChange = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  return (
    <View
      width="100%"
      position="fixed"
      bottom="0"
      left="0"
      padding="medium"
      backgroundColor="background.secondary"
      boxShadow="medium"
    >
      <Flex direction="column" alignItems="center" gap="small">
        <audio ref={audioRef} src={audioSrc} />
        <SliderField
          label="Progress"
          labelHidden
          min={0}
          max={isNaN(duration) ? 0 : duration}
          value={currentTime}
          onChange={handleSliderChange}
          width="80%"
        />
        <Flex alignItems="center" gap="large">
          <Button variation="link" onClick={() => seek(-10)}>
            <Icon as={MdReplay10} fontSize="2rem" />
          </Button>
          <Button variation="primary" size="large" onClick={togglePlayPause}>
            <Icon as={isPlaying ? MdPause : MdPlayArrow} fontSize="3rem" />
          </Button>
          <Button variation="link" onClick={() => seek(10)}>
            <Icon as={MdForward10} fontSize="2rem" />
          </Button>
        </Flex>
      </Flex>
    </View>
  );
}
