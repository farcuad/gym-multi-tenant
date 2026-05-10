export interface AppConfig {
  id: number;   
  platform: string;
  download_url: string;
  version_label: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}