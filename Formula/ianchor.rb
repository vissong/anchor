class Ianchor < Formula
  desc "Sync config files to iCloud Drive via symlinks"
  homepage "https://github.com/vissong/anchor"
  url "https://github.com/vissong/anchor/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "e8d0f31e44ff563aa91e72833832609fc497f5ebc62d97d473b1d3345433f22c"
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
