import {
  LayoutDashboard, LineChart, HelpCircle, Megaphone, GraduationCap,
  ShieldCheck, Plug, Headphones, Download, Globe, ExternalLink,
  ShoppingCart, Users, Calendar, Settings, BarChart3, BookOpen,
  Wallet, ClipboardList, Store, FileText, Search, Bell,
  MessageSquare, Mail, Star, Heart, Zap, Target, Trophy,
  Home, Building, Phone, Video, Image, Music, Coffee,
  Sun, Moon, Cloud, Map, Compass, Flag, Award, Gift,
  Bookmark, Briefcase, Calculator, Camera, Clock, Database,
  Edit, Eye, Filter, Hash, Key, Link2, Lock,
  Monitor, Newspaper, Palette, PenTool, PieChart, Printer,
  Rocket, Save, Scissors, Send, Shield, Shuffle,
  Smartphone, Speaker, Stamp, Tag, Terminal, ThumbsUp, Trash,
  Upload, User, Wifi, Wind, Wrench,
} from "lucide-react"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, LineChart, HelpCircle, Megaphone, GraduationCap,
  ShieldCheck, Plug, Headphones, Download, Globe, ExternalLink,
  ShoppingCart, Users, Calendar, Settings, BarChart3, BookOpen,
  Wallet, ClipboardList, Store, FileText, Search, Bell,
  MessageSquare, Mail, Star, Heart, Zap, Target, Trophy,
  Home, Building, Phone, Video, Image, Music, Coffee,
  Sun, Moon, Cloud, Map, Compass, Flag, Award, Gift,
  Bookmark, Briefcase, Calculator, Camera, Clock, Database,
  Edit, Eye, Filter, Hash, Key, Link2, Lock,
  Monitor, Newspaper, Palette, PenTool, PieChart, Printer,
  Rocket, Save, Scissors, Send, Shield, Shuffle,
  Smartphone, Speaker, Stamp, Tag, Terminal, ThumbsUp, Trash,
  Upload, User, Wifi, Wind, Wrench,
}

export const ICON_OPTIONS = Object.keys(ICON_MAP).map(name => ({
  name,
  component: ICON_MAP[name],
}))

export function getIconComponent(name: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[name] || LayoutDashboard
}
