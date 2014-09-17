/**
 * Google Plus Widget
 *
 * jQuery plugin showing latest posts from Google+ profiles/pages.
 * Usage instructions: https://github.com/kminek/Google-Plus-Widget
 *
 * @copyright Copyright 2011, Grzegorz Wójcik <kontakt@kminek.pl> (http://www.kminek.pl)
 * @link https://github.com/kminek/Google-Plus-Widget
 * @license BSD License (http://www.kminek.pl/bsdlicense.txt)
 *
 */

(function($){

    $.fn.googlePlusWidget = function(options) {

        options = $.extend({}, $.fn.googlePlusWidget.defaults, options);

        return this.each(function(){

            var element = $(this);
            element.html('');

            var container = $('<div class="google-plus-widget-container"></div>');
            container.appendTo(element);

            var items = $('<ul class="google-plus-widget-items"></ul>');
            items.appendTo(container);

            var more = $('<div class="google-plus-widget-more"><a href="#">' + options.captionMore + '</a></div>');
            more.click(function(){
                fetchItems({
                    pageToken: nextPageToken
                });
                return false;
            });

            var nextPageToken = null;

            var fetchData = function(handler, url, params) {
                var data = {
                    key: options.key,
                    prettyprint: true,
                };
                if (params) data = $.extend(data, params);
                $.ajax({
                    url: url,
                    data: data,
                    success: handler,
                    cache: true,
                    dataType: 'jsonp'
                });
            };

            var fetchItems = function(params) {
                if (!params) params = {};
                fetchData(handleItemsResponse, 'https://www.googleapis.com/plus/v1/people/' + options.user + '/activities/public', $.extend({
                    maxResults: options.maxResults,
                    fields: "nextPageToken,items(published,title,url,actor,object(content,replies,attachments))"
                }, params));
            };

            var fetchProfile = function() {
                fetchData(handleProfileResponse, 'https://www.googleapis.com/plus/v1/people/' + options.user, {
                    fields: "displayName,image,tagline,url"
                });
            }

            var handleItemsResponse = function(response) {
                if (response.error) {
                    var error = $('<li class="google-plus-widget-item"><div class="google-plus-widget-error">' + response.error.message + '</div></li>');
                    error.appendTo(items);
                    return;
                }
                if (typeof response.items != 'undefined' && response.items.length) {
                    more.appendTo(container);
                    $(response.items).each(function(index, value){
                        var item = $('<li class="google-plus-widget-item"></li>').css('opacity', 0);
                        item.appendTo(items);
                        
                        if(options.image === 'avatar'){
                            var postImage = $('<div class="google-plus-widget-avatar"><a href="' + this.actor.url + '" target="_blank" title="' + this.actor.displayName + '"><img class="avatar" src="' + this.actor.image.url + '" width="20" height="20" alt="' + this.actor.displayName + '" /></a></div>');
                            postImage.appendTo(item);
                        }else if(options.image === 'attachment'){
                            var firstAttachment = this.object.attachments[0];
                            if (firstAttachment !== undefined ) {
                                var postImage = $('<div class="google-plus-widget-avatar"><a href="' + this.url + '" target="_blank" title="' + firstAttachment.displayName + '"><img class="image" src="' + firstAttachment.image.url + '" alt="' + firstAttachment.displayName + '" /></a></div>');
                                postImage.appendTo(item);
                                
                            }
                        }

                        if(options.showLinks){
                            var permalink = $('<div class="google-plus-widget-permalink"><a href="' + this.url + '" target="_blank" title="' + options.captionPermalink + '">#</a></div>');
                            permalink.appendTo(item);
                        }

                        var title = $('<div class="google-plus-widget-title"><div class="google-plus-widget-title-link"><a href="' + (options.showContent ? '#' : this.url) + '">' + this.title + '</a></div></div>');
                        if(options.showContent){
                            title.click(function(){
                                $(this).next().fadeToggle();
                                $(this).find('a').toggleClass('active');
                                return false;
                            });
                        }
                        
                        title.appendTo(item);
                        
                        if(options.showComments){                    
                            var comments = $('<div class="google-plus-widget-comments"><a href="' + this.url + '" target="_blank" title="' + options.captionComments + '">' + this.object.replies.totalItems + '</a></div>');
                            comments.appendTo(title);
                        }

                        if(options.showContent){
                            var content = $('<div class="google-plus-widget-content">' + this.object.content + '</div>').css({"display" : "none"});
                            content.appendTo(item);
                        }

                        var foundAttachments = 0;
                        var attachments = [];

                        $(this.object.attachments).each(function(){
                            if ((typeof this.displayName != 'undefined') && (typeof this.url != 'undefined')) {
                                foundAttachments++;
                                var attachment = $('<div class="google-plus-widget-attachment"><a target="_blank" href="' + this.url + '">' + this.displayName + '</a></div>');
                                attachments.push(attachment);
                            }
                        });

                        if (foundAttachments) {
                            $('<div class="google-plus-widget-hr"></div>').appendTo(content);
                            $(attachments).each(function(){
                                $(this).appendTo(content)
                                });
                        }

                        var duration = (index + 1) * 200;
                        item.animate({
                            opacity: 1
                        }, duration);
                    });
                    if (typeof response.nextPageToken != 'undefined' && response.nextPageToken) {
                        nextPageToken = response.nextPageToken;
                    }
                    if (response.items.length < options.maxResults) {
                        more.remove();
                    }
                }
            };

            var handleProfileResponse = function(response) {
                if (response.error) {
                    return;
                }
                var profile = $('<div class="google-plus-widget-profile"><a title="' + options.captionAddToCircles + '" href="' + response.url + '" target="_blank">' + response.displayName + '</a></div>');
                profile.prependTo(container);
                if (typeof response.tagline != 'undefined') {
                    var tagline = $('<span>&nbsp;' + response.tagline + '</span>');
                    tagline.appendTo(profile.find('a'));
                }
            };

            fetchProfile();
            fetchItems();
        });

    };

    $.fn.googlePlusWidget.defaults = {
        maxResults: 4,
        image : 'attachment', // avatar | attachment
        showContent: true,
        showLinks: true,
        showComments: true,
        captionMore: 'more',
        captionPermalink: 'see on Google+',
        captionComments: 'see comments on Google+',
        captionAddToCircles: 'add to circles'
    };

})(jQuery);