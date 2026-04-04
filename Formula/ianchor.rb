class Ianchor < Formula
  desc "Sync config files to iCloud Drive via symlinks"
  homepage "https://github.com/vissong/ianchor"
  url "https://github.com/vissong/anchor/archive/refs/tags/v0.1.4.tar.gz"
  sha256 "cf2d72a31145a33a471c4439d743dcd845afd9012358ba86a499c8e8e83501e0"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", "--omit=dev"
    libexec.install Dir["*"]
    bin.install_symlink libexec/"bin/ianchor.js" => "ianchor"

    # Generate and install shell completions
    (zsh_completion/"_ianchor").write Utils.safe_popen_read(libexec/"bin/ianchor.js", "completion", "zsh")
    (bash_completion/"ianchor").write Utils.safe_popen_read(libexec/"bin/ianchor.js", "completion", "bash")
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/ianchor --version")
  end
end
