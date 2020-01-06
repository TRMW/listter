source 'https://rubygems.org'
ruby '2.6.3'

gem 'rails', '~> 5.0.0'

# Bundle edge Rails instead:
# gem 'rails', :git => 'git://github.com/rails/rails.git'

# add postgre adaptor for heroku
group :production do
  gem 'pg'
  gem 'guard-livereload'
end

group :development, :test do
  gem 'sqlite3', '~> 1.3', '< 1.4'
end

group :development do
  gem "better_errors"
  gem "binding_of_caller"
end

gem 'puma', '~> 3.0'
gem 'sass-rails'
gem 'jquery-rails'
gem 'jquery-ui-rails'
gem 'omniauth-twitter'
gem 'twitter'
gem 'foreman'
gem 'bugsnag'

# To use ActiveModel has_secure_password
# gem 'bcrypt-ruby', '~> 3.0.0'

# To use Jbuilder templates for JSON
# gem 'jbuilder'

# Use unicorn as the web server
# gem 'unicorn'

# Deploy with Capistrano
# gem 'capistrano'

# To use debugger
# gem 'ruby-debug19', :require => 'ruby-debug'
