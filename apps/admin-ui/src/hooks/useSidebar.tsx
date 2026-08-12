import { useAtom } from "jotai";
import { activeSidebarItem } from "../configs/contants";

export default function useSidebar() {
  const [activeSidebar, setActiveSidebar] = useAtom(activeSidebarItem);
  return { activeSidebar, setActiveSidebar };
}