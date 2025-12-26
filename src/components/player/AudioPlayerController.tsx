'use client';

import React, { useCallback, useState } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import { PlayerPlatform } from '@/domain/player/PlayerConstants';
import { handleClientError } from '@/lib/client-error';
import { AudioPlayerAdapter } from './AudioPlayerAdapter';

/**
 * [REQ-UI-GLOBAL-PLAYER] Audio Player Controller (Smart Container)
 * 
 * グローバルな AudioPlayerContext を、Dumb Component である AudioPlayerAdapter に接続します。
 * 担当:
 * - 状態の同期 (Context -> Props)
 * - イベントのハンドリング (Props -> Context)
 * - エラー報告 (Sentry/Toast)
 */
export default function AudioPlayerController() {
    const {
        src,
        platform,
        isPlaying,
        volume,
        setPlayerInstance,
        _onReady,
        _onStateChange,
        _onProgress,
        _onDuration,
        startSeconds,
        endSeconds,
        playbackId,
        seekTo, // Context上は関数だが、Dumb Componentへは値として渡す必要がある
        // メモ: 現在のContext実装は `playerRef.current.seekTo` を直接操作する命令的な設計になっている。
        // Dumb Component が完全にProps駆動であることを目指す場合、この設計はミスマッチ。
        // コンテキストの互換性を維持するため、AudioPlayer 側への操作をプロキシするオブジェクトを作成し、
        // `setPlayerInstance` に登録するアプローチをとる。
    } = useAudioPlayer();

    // Context からの命令的 seekTo 呼び出しを、AudioPlayerAdapter の props 変更(seekTo) に変換するためのローカルステート
    const [seekTrigger, setSeekTrigger] = useState<number | null>(null);

    // Context に登録するためのプロキシインスタンスを作成
    // Context が `instance.seekTo(time)` を呼ぶと、ローカルステート `seekTrigger` が更新される
    // AudioPlayerAdapter は `seekTo` prop の変更を検知してシークする
    const proxyInstance = React.useMemo(() => ({
        seekTo: (time: number, allowSeekAhead: boolean) => {
            console.debug('[AudioPlayerController] Contextからのシーク要求:', time);
            setSeekTrigger(time);
        },
        setVolume: (vol: number) => {
            // Contextの `setVolume` は状態更新とRef操作の両方を行う
            // ここではProps経由で音量が渡されるため、Ref操作はログ出力のみで実質無視しても問題ない場合が多いが、
            // 念のためログを残す
        },
        // react-youtube の内部メソッドがContextから呼ばれる可能性があるため、
        // 必要なメソッドのみを安全に公開する
    }), []);

    // コンポーネントマウント時にプロキシを登録
    React.useEffect(() => {
        setPlayerInstance(proxyInstance);
    }, [setPlayerInstance, proxyInstance]);

    const handleReady = useCallback((duration: number) => {
        _onReady(duration);
        console.log('[AudioPlayerController] Ready. Duration:', duration);
    }, [_onReady]);

    const handleError = useCallback((error: any) => {
        handleClientError(error, '音楽再生エラー');
        // 無限ループやUI不整合を防ぐため、Contextの再生状態を停止する
        _onStateChange(false);
    }, [_onStateChange]);

    const handleProgress = useCallback((time: number) => {
        _onProgress(time);
    }, [_onProgress]);

    const handleEnded = useCallback(() => {
        _onStateChange(false);
    }, [_onStateChange]);

    const handleStateChange = useCallback((playing: boolean) => {
        _onStateChange(playing);
    }, [_onStateChange]);

    if (!src) return null;

    return (
        <AudioPlayerAdapter
            src={src}
            platform={platform || PlayerPlatform.YOUTUBE}
            isPlaying={isPlaying}
            volume={volume}
            startTime={startSeconds} // Adapter uses generic name, mapping from Context's startSeconds
            endTime={endSeconds}
            playbackId={playbackId}
            seekTo={seekTrigger}
            onReady={handleReady}
            onProgress={handleProgress}
            onDuration={_onDuration}
            onEnded={handleEnded}
            onError={handleError}
            onStateChange={handleStateChange}
        />
    );
}
