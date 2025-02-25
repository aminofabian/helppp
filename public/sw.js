self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  const options = {
    body: data.content,
    icon: '/fitrii.png', // Using existing fitrii logo
    badge: '/fitrii.png', // Using existing fitrii logo as badge
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