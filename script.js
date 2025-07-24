document.addEventListener("DOMContentLoaded", function () {
  const allSlots = [
    { id: "A1", lat: 17.611408, lng: 78.082307 },
    { id: "A2", lat: 17.611024, lng: 78.082375 },
    { id: "B1", lat: 17.609664, lng: 78.082139 },
    { id: "B2", lat: 17.604418, lng: 78.083770 },
    { id: "C1", lat: 17.610012, lng: 78.084500 },
    { id: "C2", lat: 17.608000, lng: 78.081900 }
  ];

  let map, focusMap;

  function renderSlotStatus() {
    const bookedSlots = JSON.parse(localStorage.getItem('bookedSlots')) || [];

    if (map) {
      map.remove();
    }

    showMapWithSlots(bookedSlots);
  }

  window.showMapWithSlots = function (bookedSlots = []) {
    const mapDiv = document.getElementById("map");
    if (!mapDiv) return;

    map = L.map('map').setView([17.610, 78.082], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    setTimeout(() => map.invalidateSize(), 100);

    allSlots.forEach(slot => {
      const marker = L.marker([slot.lat, slot.lng]).addTo(map);
      const popupContent = bookedSlots.includes(slot.id)
        ? `<strong>Slot ${slot.id}</strong><br/>Already booked`
        : `<strong>Slot ${slot.id}</strong><br/><button onclick=\"selectSlot('${slot.id}')\">Book</button>`;
      marker.bindPopup(popupContent);
    });
  };

  window.selectSlot = function (slotId) {
    document.getElementById("slot").value = slotId;
    document.getElementById("selectedSlotDisplay").textContent = slotId;

    document.getElementById("bookingForm").classList.remove("hidden");
    initMapForSlot(slotId);
  };

  function initMapForSlot(slotId) {
    const slot = allSlots.find(s => s.id === slotId);
    if (!slot) return;

    const mapDiv = document.getElementById("mapFocus");
    mapDiv.classList.remove("hidden");
    document.getElementById("navigateLink").classList.remove("hidden");

    if (focusMap) {
      focusMap.remove();
    }

    focusMap = L.map("mapFocus").setView([slot.lat, slot.lng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(focusMap);
    L.marker([slot.lat, slot.lng]).addTo(focusMap).bindPopup(`Slot ${slot.id}`).openPopup();

    const navLink = `https://www.google.com/maps/dir/?api=1&destination=${slot.lat},${slot.lng}`;
    document.getElementById("navigateLink").href = navLink;
  }

  document.getElementById("bookingForm").addEventListener("submit", function (e) {
    e.preventDefault();

    document.getElementById("loadingSpinner").classList.remove("hidden");

    const name = document.getElementById("name").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const slot = document.getElementById("slot").value;

    sessionStorage.setItem("bookingData", JSON.stringify({ name, date, time, slot }));

    const booked = JSON.parse(localStorage.getItem("bookedSlots")) || [];
    if (!booked.includes(slot)) {
      booked.push(slot);
      localStorage.setItem("bookedSlots", JSON.stringify(booked));
    }

    renderSlotStatus();

    setTimeout(() => {
      document.getElementById("loadingSpinner").classList.add("hidden");
      const section = document.getElementById("paymentSection");
      section.classList.remove("hidden");
      section.classList.add("show");
    }, 1500);
  });

  document.getElementById("paymentMethod").addEventListener("change", function () {
    document.getElementById("paymentDetails").classList.toggle("hidden", !this.value);
  });

 window.makePayment = function () {
  const data = JSON.parse(sessionStorage.getItem("bookingData"));
  const method = document.getElementById("paymentMethod").value;

  if (!data || !method) {
    alert("Missing booking or payment information.");
    return;
  }

  const user = localStorage.getItem("currentUser");
  if (!user) {
    alert("User not logged in.");
    return;
  }

  // Save to booking history
  const historyKey = `user_${user}_history`;
  const userHistory = JSON.parse(localStorage.getItem(historyKey)) || [];
  userHistory.push({ ...data, method });
  localStorage.setItem(historyKey, JSON.stringify(userHistory));

  // Confirmation display
  const confirmation = document.getElementById("confirmation");
  confirmation.classList.remove("hidden");
  confirmation.innerHTML = `
    <h3>Booking & Payment Successful!</h3>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Date:</strong> ${data.date}</p>
    <p><strong>Time:</strong> ${data.time}</p>
    <p><strong>Slot:</strong> ${data.slot}</p>
    <p><strong>Paid via:</strong> ${method}</p>
    <button onclick="cancelBooking('${data.slot}')">Cancel Booking</button>
  `;

  // Reset UI
  document.getElementById("bookingForm").reset();
  document.getElementById("paymentSection").classList.add("hidden");
  document.getElementById("paymentDetails").classList.add("hidden");
  document.getElementById("mapFocus").classList.add("hidden");
  document.getElementById("navigateLink").classList.add("hidden");

  renderSlotStatus();
};

  window.resetBookings = function () {
    localStorage.removeItem("bookedSlots");
    renderSlotStatus();
    alert("All bookings have been reset!");
  };

  window.logout = function () {
    localStorage.removeItem("loggedIn");
    window.location.href = "login.html";
  };
window.searchLocation = function () {
  const query = document.getElementById("locationSearch").value.trim();
  if (!query) return alert("Please enter a location");

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.length === 0) {
        alert("Location not found.");
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      map.setView([lat, lon], 16); // Zoom to location
      L.marker([lat, lon]).addTo(map)
        .bindPopup(`Search Result: ${query}`)
        .openPopup();
    })
    .catch(err => {
      console.error("Geocoding error:", err);
      alert("Failed to fetch location.");
    });
};
window.cancelBooking = function (slotId) {
  const booked = JSON.parse(localStorage.getItem("bookedSlots")) || [];
  const updated = booked.filter(id => id !== slotId);
  localStorage.setItem("bookedSlots", JSON.stringify(updated));
  sessionStorage.removeItem("bookingData");
  renderSlotStatus();
  document.getElementById("confirmation").innerHTML = "<p>Booking cancelled.</p>";
};

  // 🔥 Trigger map display after login
  if (localStorage.getItem("loggedIn") === "true") {
    renderSlotStatus();
  }
});
