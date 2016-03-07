class ListsController < ApplicationController
  before_filter :check_current_user_for_json, :only => [:index, :user]

  def index
    respond_to do |format|
      format.html # just render the view - Ember.js takes it from there
      format.json do
        client = Twitter::Client.new(
          :oauth_token => current_user.token,
          :oauth_token_secret => current_user.secret
        )
        render json: client.lists_owned
      end
    end
  end

  def remove
    client = Twitter::Client.new(
      :oauth_token => current_user.token,
      :oauth_token_secret => current_user.secret
    )

    begin
      client.list_destroy(params[:list_id].to_i)
    rescue
      render :text => "There was an error saving your changes on Twitter: #{$!.message}", :status => :bad_gateway and return
    end

    render :json => { 'message' => 'List was deleted!', 'id' => params[:list_id] }
  end

  def merge
    target = params[:targetList]
    lists_to_merge = params[:listsToMerge]
    new_list_name = params[:newListName]
    merge_to_new = params[:mergeToNewList] == 'true'
    delete_on_merge = params[:deleteOnMerge] == 'true'
    users_to_add = []

    client = Twitter::Client.new(
      :oauth_token => current_user.token,
      :oauth_token_secret => current_user.secret
    )

    # users have the option of merging to a new or existing list - create a new one if needed
    if (merge_to_new)
      if (new_list_name != '')
        begin
          new_list = client.list_create(new_list_name)
          target = new_list.id
        rescue
          render :text => 'Users can only have a max of 1,000 lists on Twitter. Looks like you have too many to create your new merged list. If you delete a list and try again it should work. Sorry about that!', :status => :bad_gateway and return
        end
      else
        render :text => 'You forgot to enter a name for your new list. Please try again.', :status => :unprocessable_entity and return
      end
    end

    # add user IDs from all lists - must grab from twitter in batches
    lists_to_merge.each do |list_id|
      cursor = "-1"
      begin
        while cursor != 0 do
          list_members = client.list_members(list_id.to_i, { :cursor => cursor})
          users_to_add += list_members.users.collect { |user| user.id }
          cursor = list_members.next_cursor
        end
      rescue
        render :text => "There was an error getting list members from Twitter: #{$!.message}", :status => :bad_gateway and return
      end
    end

    # can only add 100 users at a time
    while users_to_add.length > 0
      begin
        client.list_add_members(target.to_i, users_to_add.slice!(0, 100))
      rescue Twitter::Error::BadGateway
        next # silently ignore 502 errors since Twitter gem seems to throw them even when successful
      rescue
        render :text => "There was an error saving your changes on Twitter: #{$!.message}", :status => :bad_gateway and return
      end
    end

    # get updated member count for target list
    updated_list = client.list(target.to_i)
    updated_member_count = updated_list.member_count
    list_uri = updated_list.uri

    # delete lists after successful merge, if option is selected
    if (delete_on_merge)
      lists_to_merge.each do |list_id|
        client.list_destroy(list_id.to_i)
      end
    end

    render :json => { 'message' => 'Lists merged!', 'newListId' => target, 'updatedMemberCount' => updated_member_count, 'listUri' => list_uri }
  end

  def user
    client = Twitter::Client.new(
      :oauth_token => current_user.token,
      :oauth_token_secret => current_user.secret
    )
    render json: client.user
  end

end
