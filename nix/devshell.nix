{ nixpkgs, system }:
let
  pkgs = import nixpkgs { inherit system; };

  isDarwin = pkgs.stdenv.isDarwin;

  # Common packages for all shells
  commonPackages =
    with pkgs;
    [
      curl
      wget
      git
      just
      watchman
      nixfmt-rfc-style
      nixfmt-tree
      statix
      deadnix
      nil
      bun
      nodejs_24
      starship
    ]
    ++ pkgs.lib.optionals isDarwin [
      cocoapods
    ];

  # Common shell configuration
  commonShell = {
    preferLocalBuild = true;
    shell = "${pkgs.zsh}/bin/zsh";
  };
in
{
  # Default development shell
  default = pkgs.mkShell (
    commonShell
    // {
      buildInputs = commonPackages;

      shellHook = ''
        echo "Bun version: $(bun --version)"
        echo "Node version: $(node --version)"
        echo "🚀 Development shell activated, you can now compile things"
      '';
    }
  );

  # Android development shell
  android = pkgs.mkShell (
    commonShell
    // {
      buildInputs =
        commonPackages
        ++ (with pkgs; [
          jdk17
          android-tools
        ]);

      shellHook = ''
        echo "Bun version: $(bun --version)"
        echo "Node version: $(node --version)"
        echo "Java version: $(java --version | head -1)"
        echo "🚀 Android dev shell activated!"
        echo ""
        echo "For Android builds, you'll also need to:"
        echo "1. Install Android Studio from https://developer.android.com/studio"
        echo "2. Install SDK platforms via Android Studio's SDK Manager"
        echo "3. Set ANDROID_HOME environment variable"
      '';
    }
  );
}
