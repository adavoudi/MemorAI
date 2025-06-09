"use client";

import { useState, useRef, useEffect } from "react";
import {
  Flex,
  Button,
  Icon,
  SliderField,
  Text,
  View,
} from "@aws-amplify/ui-react";
import { MdPlayArrow, MdPause, MdReplay10, MdForward10 } from "react-icons/md";

// In a real app, this would come from your API with timings
interface Subtitle {
  text: string;
  start: number; // in seconds
  end: number;
}

interface AudioPlayerProps {
  audioSrc: string;
  subtitles: Subtitle[];
}

export default function AudioPlayer({ audioSrc, subtitles }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSubtitle, setActiveSubtitle] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => {
      const newTime = audio.currentTime;
      setCurrentTime(newTime);
      const currentSubtitle = subtitles.find(
        (s) => newTime >= s.start && newTime <= s.end
      );
      setActiveSubtitle(currentSubtitle ? currentSubtitle.text : "");
    };

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);

    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
    };
  }, [subtitles]);

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
      audioRef.current.currentTime += amount;
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
    >
      <Flex direction="column" alignItems="center" gap="large">
        {/* Subtitle Display */}
        <Text fontSize="xxl" fontWeight="bold" minHeight="3rem">
          {activeSubtitle}
        </Text>

        {/* Player Controls */}
        <audio
          ref={audioRef}
          src={audioSrc}
          onEnded={() => setIsPlaying(false)}
        />
        <SliderField
          label="Progress"
          // hideLabel
          min={0}
          max={duration}
          value={currentTime}
          onChange={(value) => {
            if (audioRef.current) audioRef.current.currentTime = value;
          }}
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
