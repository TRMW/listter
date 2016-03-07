class ApplicationController < ActionController::Base
  protect_from_forgery
  helper_method :current_user
  helper_method :check_current_user_for_json

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

  private

  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end

  def check_current_user_for_json
    if request.format.json? and not current_user
      render :json => [], :status => :unauthorized
      flash[:alert] = "Woops, looks like we couldn't grab your Twitter info. Please reauthorize by clicking below."
      return
    end
  end
end
