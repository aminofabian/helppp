self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  const options = {
    body: data.content,
    icon: '/icon.png', // Make sure to add an icon file
    badge: '/badge.png', // Make sure to add a badge file
    vibrate: [200, 100, 200],
    data: {
      url: data.url // URL to open when notification is clicked
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
}); 