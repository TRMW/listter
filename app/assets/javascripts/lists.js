var Listter = Em.Application.create();

Listter.List = Ember.Object.extend({
  name: null,
  id: null,
  members: null,
  isChecked: false
});

Listter.listsController = Ember.ArrayController.create({
  content: [],
  
  targetSelection: null,
  
  mergeToNewList: false,
  
  deleteOnMerge: false,
  
  loadLists: function(){
    var uid =  $('#lists-container').data('uid');
    
    $.getJSON('https://api.twitter.com/1/lists/all.json?user_id=' + uid + '&callback=?', function(response){
      
      // Add all users personal list (not subscribed)
      response.forEach(function(list){
        if(list.user.id === uid){
          var list = Listter.List.create({ name: list.name, id: list.id, members: list.member_count, isChecked: false });
          Listter.listsController.pushObject(list);
        }
      });
    
    });
    
  },
  
  checked: function() {
   return this.filterProperty('isChecked')
  }.property('@each.isChecked').cacheable(),
  
  lessThanTwoSelected: function() {
    if( this.filterProperty('isChecked').length >= 2 ) {
      return false;
    }
    else {
      return true;
    }
  }.property('@each.isChecked').cacheable(),
  
  toggleMergeType: function() {
    $('#merge-target-field').toggle();
    $('#new-list-field').toggle();
    this.mergeToNewList = !this.mergeToNewList
  },
  
  mergeLists: function() {
    // Initialize merge target to first list selected
    Listter.listsController.set('targetSelection', Listter.listsController.get('checked')[0]);
    
    // Remove any errors from last merge
    $('#merge-dialog .error').remove();
    
    // Clear new list name
    $('#new-list-name')[0].value = "";
    
		var mergeDialog = $('#merge-dialog').dialog({
		  title: 'Merge Options',
			modal: true,
			resizable: false,
			width: 275,
			minHeight: false,
			buttons: {
				'Merge Lists': function() {
          var listsToMerge = [],
            tooManyMembers = false,
            mergedMemberCount = Listter.listsController.mergeToNewList ? 0 : Listter.listsController.targetSelection.members,
            listObjectsToMerge = [],
            targetList = Listter.listsController.mergeToNewList ? null : Listter.listsController.targetSelection.id,
            newListName = $('#new-list-name')[0].value;
          
          // Add all checked lists (that aren't the target) to merge list
          Listter.listsController.get('checked').forEach(function(list){
            if ( list.id !== targetList ) {
              if ( mergedMemberCount + list.members <= 500 ) {
                listsToMerge.push(list.id);
                listObjectsToMerge.push(list);
                mergedMemberCount += list.members;
              }
              else {
                tooManyMembers = true;
              }
            }
          });
          
          if ( listsToMerge.length ) {
            $.ajax({
              url: '/lists/merge',
              type: 'POST',
              dataType: 'json',
              data: {
                targetList: targetList,
                newListName: newListName,
                listsToMerge: listsToMerge,
                deleteOnMerge: Listter.listsController.deleteOnMerge,
                mergeToNewList: Listter.listsController.mergeToNewList,
                authenticity_token: $('meta[name="csrf-token"]').attr("content")
              },
              success: function(response) {
                var dialog = mergeDialog.dialog('widget'), 
                  buttons = dialog.find('.ui-dialog-buttonset button');
                
                $(buttons).attr('disabled', false);
                $('.ui-dialog-titlebar .spinner', dialog).remove();
                
                if ( Listter.listsController.deleteOnMerge ) { 
                  // Remove deleted lists
                  Listter.listsController.removeObjects(listObjectsToMerge);
                }
                
                if ( Listter.listsController.mergeToNewList ) {
                  // Add new list
                  var newList = Listter.List.create({ name: newListName, id: response.newListId, members: mergedMemberCount, isChecked: false });
                  Listter.listsController.unshiftObject(newList);
                }
                
                else {
                  // Update visible member count indicator
                  Listter.listsController.targetSelection.set('members', response.updatedMemberCount);
                }
                
                Listter.listsController.setEach('isChecked', false);
                mergeDialog.dialog("close");
                
                if ( tooManyMembers ) {
        				  $('<div>Twitter only allows a max of 500 members for each list. Your selected lists combined are bigger than that, so some of them weren\'t able to be added. Sorry!</div>')
        				    .dialog({
        				      title: 'Merge Warning',
        				      dialogClass: 'alert-dialog',
        				      resizable: false,
        				      width: 260,
        				      minHeight: false
        				    });
                }
              },
              error: function(xhr) {
                var dialog = mergeDialog.dialog('widget'), 
                  buttons = dialog.find('.ui-dialog-buttonset button');
                  
                $(buttons).attr('disabled', false);
                $('.ui-dialog-titlebar .spinner', dialog).remove();
                
                mergeDialog.prepend('<div class="error">' + xhr.responseText + '</div>');
              },
              beforeSend: function() {
                $('.error', mergeDialog).remove();
                
                var spinner = new Spinner({ length: 4, width: 2, radius: 5 }).spin(),
                  dialog = mergeDialog.dialog('widget'),
                  target = dialog.find('.ui-dialog-titlebar')[0],
                  buttons = dialog.find('.ui-dialog-buttonset button');
                  
                target.appendChild(spinner.el);
                $(buttons).attr('disabled', 'disabled');
              }
            });
          }
          
          else {
  				  mergeDialog.dialog("close");
  				  $('<div>Twitter only allows a max of 500 members for each list. Your selected lists combined are bigger than that, so none of them were able to be added. Sorry!</div>')
  				    .dialog({
  				      title: 'Merge Error',
  				      dialogClass: 'alert-dialog',
  				      resizable: false,
  				      width: 260,
  				      minHeight: false
  				    });
  				}
          
				},
				Cancel: function() {
					mergeDialog.dialog("close");
				}
			}
		});
		
  }
});

Listter.ListView = Em.View.extend({
  classNameBindings: ['list.isChecked'],
  
  removeList: function() {
    list = this.get('list');
    
	  var confirmDialog = $('<div>Are you sure you want to delete the list <strong>' + list.name + '</strong>? This action can\'t be undone.</div>')
	    .dialog({
	      title: 'Confirmation',
	      resizable: false,
	      width: 260,
	      minHeight: false,
	      buttons: {
  	      'Delete List': function() {
            $.ajax({
              url: '/lists/remove',
              type: 'DELETE',
              dataType: 'json',
              data: {
                list_id: list.get('id'),
                authenticity_token: $('meta[name="csrf-token"]').attr("content")
              },
              success: function(){
                Listter.listsController.removeObject(list);
                confirmDialog.dialog("close");
              }
            });  
  	      },
  				Cancel: function() {
  					confirmDialog.dialog("close");
  				}
  		  }
	    });
  }
});

$(document).ready(function(){
  
  Listter.listsController.loadLists();
  
});