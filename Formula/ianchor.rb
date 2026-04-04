class Ianchor < Formula
  desc "Sync config files to iCloud Drive via symlinks"
  homepage "https://github.com/vissong/ianchor"
  url "https://github.com/vissong/anchor/archive/refs/tags/v0.1.2.tar.gz"
  sha256 "cbab69a6eb8c12e348ea7a35a4feaf3d4f56106283d8f9576df4ed40600e5440"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", "--omit=dev"
    libexec.install Dir["*"]
    bin.install_symlink libexec/"bin/ianchor.js" => "ianchor"

    # Generate and install shell completions
    output = Utils.safe_popen_read(libexec/"bin/ianchor.js", "completion")
    (bash_completion/"ianchor").write output
    (zsh_completion/"_ianchor").write output
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/ianchor --version")
  end
end
