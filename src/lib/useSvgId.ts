import { useId } from "react";

export const useSvgId = (prefix = "id") => {
  const id = useId();
  return `${prefix}-${id.replace(/:/g, "")}`;
};