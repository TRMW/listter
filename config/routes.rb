Rails.application.routes.draw do
  root to: 'lists#index'

  match 'auth/twitter/callback', to: 'application#login', via: [:get, :post]
  match 'logout', to: 'application#logout', :as => 'logout', via: [:get, :post]
  match 'user', to: 'lists#user', via: [:get, :post]
  match 'lists/new', to: 'lists#new', via: [:get, :post]
  match 'lists/remove', to: 'lists#remove', :via => :delete
  match 'lists/merge', to: 'lists#merge', :via => :post
  match 'lists', to: 'lists#index', via: [:get, :post]
end
