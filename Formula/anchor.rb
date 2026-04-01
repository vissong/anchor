class Anchor < Formula
  desc "Sync config files to iCloud Drive via symlinks"
  homepage "https://github.com/vissong/anchor"
  url "https://github.com/vissong/anchor/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "548157c49e96770955682d92e3c9406d35158d1cfc9250e835cc9e66e7c74ecf"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", "--omit=dev"
    libexec.install Dir["*"]
    bin.install_symlink libexec/"bin/anchor.js" => "anchor"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/anchor --version")
  end
end
