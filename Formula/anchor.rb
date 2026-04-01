class Anchor < Formula
  desc "Sync config files to iCloud Drive via symlinks"
  homepage "https://github.com/vissong/anchor"
  url "https://github.com/vissong/anchor/archive/refs/tags/v0.1.0.tar.gz"
  # sha256 will be filled after first release
  sha256 ""
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", "--production"
    libexec.install Dir["*"]
    bin.install_symlink libexec/"bin/anchor.js" => "anchor"
  end

  test do
    assert_match "anchor", shell_output("#{bin}/anchor --version")
  end
end
