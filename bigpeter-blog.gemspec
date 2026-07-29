# frozen_string_literal: true

lib = File.expand_path("lib", __dir__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require "bigpeter_blog/version"

Gem::Specification.new do |spec|
  spec.name          = "bigpeter-blog"
  spec.version       = BigPeterBlog::VERSION
  spec.authors       = ["BigPeter"]
  spec.email         = ["751802108@qq.com"]

  spec.summary       = "极简风格的 Jekyll 博客主题"
  spec.description   = "极简风格的 Jekyll 博客主题，支持深色/浅色双主题切换、液态玻璃视觉效果、响应式布局。"
  spec.homepage      = "https://github.com/holyshite/bigpeter-blog"
  spec.license       = "MIT"

  spec.files = Dir.chdir(__dir__) do
    Dir["{_layouts,_includes,_sass,assets,lib}/**/*", "README*", "LICENSE*"]
  end

  spec.required_ruby_version = ">= 2.5"

  spec.add_runtime_dependency "jekyll", "~> 4.4"
end
