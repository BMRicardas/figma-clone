import {
  KeyboardEvent,
  MutableRefObject,
  PointerEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useBroadcastEvent,
  useEventListener,
  useMyPresence,
} from "@/liveblocks.config";
import LiveCursors from "./cursor/live-cursors";
import { CursorChat } from "./cursor/cursor-chat";
import { CursorMode, CursorState, Reaction, ReactionEvent } from "@/types/type";
import { ReactionSelector } from "./reaction/reaction-button";
import { FlyingReaction } from "./reaction/flying-reaction";
import useInterval from "@/hooks/useInterval";
import { Comments } from "./comments/comments";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { shortcuts } from "@/constants";

interface Props {
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  undo: () => void;
  redo: () => void;
}

export function Live({ canvasRef, undo, redo }: Props) {
  const [{ cursor }, updateMyPresence] = useMyPresence();
  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.Hidden,
  });

  const [reactions, setReactions] = useState<Reaction[]>([]);
  const broadcast = useBroadcastEvent();

  const setReaction = useCallback((reaction: string) => {
    setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false });
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    event.preventDefault();

    if (cursor == null || cursorState.mode !== CursorMode.ReactionSelector) {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      updateMyPresence({ cursor: { x, y } });
    }
  }, []);

  useInterval(() => {
    setReactions((reactions) =>
      reactions.filter((r) => r.timestamp > Date.now() - 4000)
    );
  }, 1000);

  useInterval(() => {
    if (
      cursorState.mode === CursorMode.Reaction &&
      cursorState.isPressed &&
      cursor
    ) {
      setReactions((reactions) =>
        reactions.concat([
          {
            point: { x: cursor.x, y: cursor.y },
            value: cursorState.reaction,
            timestamp: Date.now(),
          },
        ])
      );

      broadcast({
        x: cursor.x,
        y: cursor.y,
        value: cursorState.reaction,
      });
    }
  }, 100);

  useEventListener((eventData) => {
    const event = eventData.event as ReactionEvent;

    setReactions((reactions) =>
      reactions.concat([
        {
          point: { x: event.x, y: event.y },
          value: event.value,
          timestamp: Date.now(),
        },
      ])
    );
  });

  const handlePointerLeave = useCallback((event: PointerEvent) => {
    setCursorState({ mode: CursorMode.Hidden });

    updateMyPresence({ cursor: null, message: null });
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      updateMyPresence({ cursor: { x, y } });

      setCursorState((state: CursorState) =>
        cursorState.mode === CursorMode.Reaction
          ? { ...state, isPressed: true }
          : state
      );
    },
    [cursorState.mode, setCursorState]
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      setCursorState((state: CursorState) =>
        cursorState.mode === CursorMode.Reaction
          ? { ...state, isPressed: true }
          : state
      );
    },
    [cursorState.mode, setCursorState]
  );

  useEffect(() => {
    function onKeyUp(event: KeyboardEvent) {
      if (event.key === "/") {
        setCursorState({
          mode: CursorMode.Chat,
          previousMessage: null,
          message: "",
        });
      } else if (event.key === "Escape") {
        updateMyPresence({ message: "" });
        setCursorState({ mode: CursorMode.Hidden });
      } else if (event.key === "e") {
        setCursorState({
          mode: CursorMode.ReactionSelector,
        });
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "/") {
        event.preventDefault();
      }
    }

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [updateMyPresence]);

  const handleContextMenuClick = useCallback(
    (key: string) => () => {
      switch (key) {
        case "Chat":
          setCursorState({
            mode: CursorMode.Chat,
            previousMessage: null,
            message: "",
          });
          break;

        case "Undo":
          undo();
          break;

        case "Redo":
          redo();
          break;

        case "Reaction":
          setCursorState({
            mode: CursorMode.ReactionSelector,
          });
          break;

        default:
          break;
      }
    },
    []
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger
        id="canvas"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="relative h-full w-full flex flex-1 justify-center items-center">
        <canvas ref={canvasRef} />

        {reactions.map((r) => (
          <FlyingReaction
            key={r.timestamp.toString()}
            x={r.point.x}
            y={r.point.y}
            timestamp={r.timestamp}
            value={r.value}
          />
        ))}

        {cursor && (
          <CursorChat
            cursor={cursor}
            cursorState={cursorState}
            setCursorState={setCursorState}
            updateMyPresence={updateMyPresence}
          />
        )}

        {cursorState.mode === CursorMode.ReactionSelector && (
          <ReactionSelector
            setReaction={(reaction) => {
              setReaction(reaction);
            }}
          />
        )}

        <LiveCursors />

        <Comments />
      </ContextMenuTrigger>
      <ContextMenuContent className="right-menu-content">
        {shortcuts.map((shortcut) => (
          <ContextMenuItem
            key={shortcut.key}
            onClick={() => handleContextMenuClick(shortcut.name)}
            className="right-menu-item">
            <p>{shortcut.name}</p>
            <p className="text-xs text-primary-grey-300">{shortcut.shortcut}</p>
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
