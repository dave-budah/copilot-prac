document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    activitiesList.innerHTML = "<p>Loading activities...</p>";
    try {
  // request fresh data to avoid cached responses that can hide updates
  const res = await fetch("/activities", { cache: "no-store" });
      const activities = await res.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const card = document.createElement("div");
        card.className = "activity-card";

        const title = document.createElement("h4");
        title.textContent = name;
        card.appendChild(title);

        const desc = document.createElement("p");
        desc.textContent = details.description;
        card.appendChild(desc);

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>When:</strong> ${details.schedule}`;
        card.appendChild(schedule);

        const capacity = document.createElement("p");
        capacity.innerHTML = `<strong>Capacity:</strong> ${details.participants.length}/${details.max_participants}`;
        card.appendChild(capacity);

        // Participants section
        const participantsHeader = document.createElement("div");
        participantsHeader.className = "participants-header";
        participantsHeader.textContent = "Participants";
        card.appendChild(participantsHeader);

        const ul = document.createElement("ul");
        ul.className = "participants-list";

        if (details.participants && details.participants.length) {
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // Row holds the email and the remove button
            const row = document.createElement("div");
            row.className = "participant-row";

            const span = document.createElement("span");
            span.textContent = email;
            row.appendChild(span);

            const removeBtn = document.createElement("button");
            removeBtn.className = "participant-remove";
            removeBtn.title = `Remove ${email}`;
            removeBtn.setAttribute("aria-label", `Remove ${email}`);
            removeBtn.innerHTML = "✖";

            // Click handler - call DELETE endpoint to unregister
            removeBtn.addEventListener("click", async () => {
              removeBtn.disabled = true;
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                  { method: "DELETE", cache: "no-store" }
                );

                const json = await resp.json().catch(() => ({}));
                if (resp.ok) {
                  // Refresh activities after successful removal
                  await fetchActivities();
                } else {
                  messageDiv.textContent = json.detail || json.message || "Failed to remove participant";
                  messageDiv.className = "message error";
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                }
              } catch (err) {
                console.error(err);
                messageDiv.textContent = "Network error";
                messageDiv.className = "message error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              } finally {
                removeBtn.disabled = false;
              }
            });

            row.appendChild(removeBtn);
            li.appendChild(row);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "participant-empty";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        }

        card.appendChild(ul);
        activitiesList.appendChild(card);

        // Add option to select dropdown
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        activitySelect.appendChild(opt);
      });
    } catch (err) {
      activitiesList.innerHTML = '<p class="error">Failed to load activities.</p>';
      console.error(err);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = signupForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    messageDiv.className = "hidden";

    try {
      const email = document.getElementById("email").value.trim();
      const activity = document.getElementById("activity").value;
      if (!activity) {
        messageDiv.textContent = "Please select an activity";
        messageDiv.className = "message error";
        submitButton.disabled = false;
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 4000);
        return;
      }

      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST", cache: "no-store" }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message || "Signed up";
        messageDiv.className = "message success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }
    } catch (error) {
      messageDiv.textContent = "Network error";
      messageDiv.className = "message error";
      console.error(error);
    } finally {
      submitButton.disabled = false;
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    }
  });

  // Initialize app
  fetchActivities();
});
