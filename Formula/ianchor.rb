class Ianchor < Formula
  desc "Sync config files to iCloud Drive via symlinks"
  homepage "https://github.com/vissong/ianchor"
  url "https://github.com/vissong/ianchor/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "1a44a5a84c736dfa7630e822ee01751d776b06d8e0033c095fa90305b4312784"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", "--omit=dev"
    libexec.install Dir["*"]
    bin.install_symlink libexec/"bin/ianchor.js" => "ianchor"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/ianchor --version")
  end
end
