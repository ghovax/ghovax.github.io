// Simple blog sorting functionality
$(document).ready(function () {
  // Sort by submit time (newest first)
  $("#sort-by-submit-time").click(function () {
    var articles = $(".post-item").toArray();
    articles.sort(function (a, b) {
      var timeA = $(a).find(".summit-time .last-updated").data("submitted");
      var timeB = $(b).find(".summit-time .last-updated").data("submitted");
      return timeB > timeA ? 1 : -1;
    });
    $(".container").find(".post-item").detach();
    $(".container nav").after(articles);
    return false;
  });

  // Sort by submit time (oldest first)
  $("#sort-by-submit-time-asc").click(function () {
    var articles = $(".post-item").toArray();
    articles.sort(function (a, b) {
      var timeA = $(a).find(".summit-time .last-updated").data("submitted");
      var timeB = $(b).find(".summit-time .last-updated").data("submitted");
      return timeA > timeB ? 1 : -1;
    });
    $(".container").find(".post-item").detach();
    $(".container nav").after(articles);
    return false;
  });

  // Humanize timestamps
  $(".last-updated").each(function () {
    var submittedTime = new Date($(this).data("submitted"));
    var now = new Date();
    var diffMs = now - submittedTime;
    var humanized =
      humanizeDuration(diffMs, { largest: 1, round: true }) + " ago";
    $(this).find("span").text(humanized);
  });

  // Scroll to top button
  $.scrollUp({
    scrollText: '<i class="fa fa-chevron-up"></i>',
  });
});
