export type RGBColor = [r: number, g: number, b: number]

export interface SocialCardImageOptions {
  title: string
  description?: string
  bgGradient?: RGBColor[]
  avatarUrl: string
}
