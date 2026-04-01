class Ianchor < Formula
  desc "Sync config files to iCloud Drive via symlinks"
  homepage "https://github.com/vissong/ianchor"
  url "https://github.com/vissong/anchor/archive/refs/tags/v0.1.1.tar.gz"
  sha256 "22c5fd260d3328a6d4e628c93258c3da7dbee325fb872fa3b4173c538840c1ef"
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
