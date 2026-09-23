document
.getElementById("fillBtn")
.addEventListener("click", async () => {

    const [tab] =
    await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    chrome.tabs.sendMessage(
        tab.id,
        {
            action: "fillForm"
        }
    );

});