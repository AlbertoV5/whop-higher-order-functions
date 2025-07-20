.PHONY: all upgrade-whop publish publish-all version-patch version-minor version-major changelog

PACKAGES = auth db infra ui

all: upgrade-whop

upgrade-whop:
	@for pkg in $(PACKAGES); do \
		pkg_dir="packages/$$pkg"; \
		if [ -f "$$pkg_dir/package.json" ]; then \
			echo "Checking $$pkg_dir for @whop dependencies..."; \
			WHOP_PACKAGES=$$(grep -o '"@whop/[^"]*"' "$$pkg_dir/package.json" | tr -d '"' | tr '\n' ' '); \
			if [ -n "$$WHOP_PACKAGES" ]; then \
				echo "Found packages to update:$$WHOP_PACKAGES"; \
				echo "Upgrading in $$pkg_dir..."; \
				(cd "$$pkg_dir" && bun update $$WHOP_PACKAGES); \
			else \
				echo "No @whop dependencies found in $$pkg_dir."; \
			fi; \
		fi; \
	done

publish:
	@read -p "Enter package name to publish: " pkg; \
	if [ -d "packages/$$pkg" ]; then \
		echo "Publishing $$pkg..."; \
		(cd packages/$$pkg && bun publish --access public); \
	else \
		echo "Package $$pkg not found!"; \
	fi

publish-all:
	@for pkg in $(PACKAGES); do \
		echo "Publishing $$pkg..."; \
		(cd packages/$$pkg && bun publish --access public --no-git-checks); \
	done

version-patch:
	@read -p "Enter package name to bump patch version: " pkg; \
	if [ -d "packages/$$pkg" ]; then \
		echo "Bumping patch version in $$pkg..."; \
		(cd packages/$$pkg && bun pm version patch); \
	else \
		echo "Package $$pkg not found!"; \
	fi

version-minor:
	@read -p "Enter package name to bump minor version: " pkg; \
	if [ -d "packages/$$pkg" ]; then \
		echo "Bumping minor version in $$pkg..."; \
		(cd packages/$$pkg && bun pm version minor); \
	else \
		echo "Package $$pkg not found!"; \
	fi

version-major:
	@read -p "Enter package name to bump major version: " pkg; \
	if [ -d "packages/$$pkg" ]; then \
		echo "Bumping major version in $$pkg..."; \
		(cd packages/$$pkg && bun pm version major); \
	else \
		echo "Package $$pkg not found!"; \
	fi

changelog:
	@if ! command -v conventional-changelog &> /dev/null; then \
		echo "conventional-changelog-cli not found. Running 'make install-dev-tools'..."; \
		make install-dev-tools; \
	fi
	@echo "Generating root CHANGELOG.md..."
	@touch CHANGELOG.md
	@conventional-changelog -p angular -i CHANGELOG.md -s

install-dev-tools:
	@echo "Installing conventional-changelog-cli globally..."
	@bun add -g conventional-changelog-cli

fix-ui-deps:
	@echo "Fixing UI package dependencies..."
	@rm -f packages/ui/bun.lock
	@(cd packages/ui && bun install)