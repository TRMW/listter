class ApplicationController < ActionController::Base
  protect_from_forgery
  helper_method :current_user

  def login
    # raise request.env["omniauth.auth"].to_yaml
    auth = request.env["omniauth.auth"]
    user = User.find_by_provider_and_uid(auth["provider"], auth["uid"]) || User.create_with_omniauth(auth)
    session[:user_id] = user.id
    redirect_to root_url
  end

  def logout
    session[:user_id] = nil
    redirect_to root_url
  end

  def user
    client = Twitter::Client.new(
      :oauth_token => current_user.token,
      :oauth_token_secret => current_user.secret
    )
    render json: client.user
  end

  private

  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end
end
