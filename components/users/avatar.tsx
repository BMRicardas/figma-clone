import Image from "next/image";

import styles from "./avatar.module.css";

interface Props {
  name: string;
  otherStyles: string;
}

export function Avatar({ name, otherStyles }: Props) {
  return (
    <div
      className={`${styles.avatar} ${otherStyles} h-9 w-9`}
      data-tooltip={name}>
      <Image
        src={`https://liveblocks.io/avatars/avatar-${Math.floor(
          Math.random() * 30
        )}.png`}
        alt={name}
        fill
        className={styles.avatar_picture}
      />
    </div>
  );
}
