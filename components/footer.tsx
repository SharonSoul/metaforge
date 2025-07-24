export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              MediaForge
            </div>
            <p className="text-sm text-muted-foreground">
              Download videos, images, and media from Instagram and TikTok for free.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Platforms</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#instagram" className="hover:text-foreground transition-colors">
                  Instagram Downloader
                </a>
              </li>
              <li>
                <a href="#tiktok" className="hover:text-foreground transition-colors">
                  TikTok Downloader
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Coming Soon: YouTube
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Media Types</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Videos & Reels
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Images & Carousels
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Stories & Highlights
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Profile Pictures
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  DMCA
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 MediaForge. All rights reserved.</p>
          <p className="mt-2">
            Disclaimer: This tool is for personal use only. Please respect copyright and platform terms of service.
          </p>
        </div>
      </div>
    </footer>
  )
}
