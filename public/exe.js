function main() {
    const app = document.querySelector(".app");
    const socket = io();
    let uname;
    let room;
    let hasLeft = false;
    const roomDetailsBtn = document.querySelector("#roomdetails");
    const roomPopup = document.querySelector("#roomPopup");
    const closePopup = document.querySelector(".close");
    const roomNameDisplay = document.querySelector("#roomNameDisplay");
    const roomMembersList = document.querySelector("#roomMembers");
    roomDetailsBtn.addEventListener("click", function () {
        roomNameDisplay.innerText = room;
        socket.emit("getRoomDetails", { room });
        roomPopup.style.display = "block";
    });
    closePopup.addEventListener("click", function () {
        roomPopup.style.display = "none";
    });
    socket.on("roomDetails", function (data) {
        roomMembersList.innerHTML = "";
        data.members.forEach(member => {
            let li = document.createElement("li");
            li.textContent = member;
            roomMembersList.appendChild(li);
        });
    });

    function joinchat() {
        let username = app.querySelector(".joinscreen #username").value;
        let roomname = app.querySelector(".joinscreen #roomname").value;
        if (username.length === 0 || roomname.length === 0) {
            alert("Username and Room Name cannot be empty");
            return;
        }

        uname = username;
        room = roomname;
        hasLeft = false;

        socket.emit("joinroom", { username: uname, room: room });

        app.querySelector(".joinscreen").classList.remove("active");
        app.querySelector(".chatscreen").classList.add("active");
    }
    app.querySelector(".joinscreen #joinuser").addEventListener("click", joinchat);
    app.querySelector(".joinscreen #username").addEventListener("keypress", function (k) {
        if (k.key === "Enter") {
            joinchat();
        }
    });

    function currentTime() {
        const t = new Date();
        let hour = t.getHours();
        let minute = t.getMinutes();
        if (minute < 10) {
            minute = "0" + minute;
        }
        if (hour < 10) {
            hour = "0" + hour;
        }
        return hour + ":" + minute;
    }

    function sendmessage() {
        let message = app.querySelector(".chatscreen #messageinput").value;
        if (message.length === 0) {
            alert("Type something to send");
            return;
        }

        const time = currentTime();
        detectmessage("my", { username: uname, text: message, time: time });

        socket.emit("chat", { username: uname, text: message, time: time, room: room });

        app.querySelector(".chatscreen #messageinput").value = "";
    }

    app.querySelector(".chatscreen #sendmessage").addEventListener("click", sendmessage);
    app.querySelector(".chatscreen #messageinput").addEventListener("keypress", function (k) {
        if (k.key === "Enter") {
            sendmessage();
        }
    });

    app.querySelector(".chatscreen #exitchat").addEventListener("click", function () {
        if (hasLeft) return;
        hasLeft = true;
        socket.emit("exitroom", { username: uname, room: room });
        this.disabled = true;
        setTimeout(() => {
            this.disabled = false;
        }, 2000);
        window.location.href = window.location.href;
    });

    window.addEventListener("beforeunload", function () {
        if (!hasLeft) {
            socket.emit("exitroom", { username: uname, room: room });
            hasLeft = true;
        }
    });

    socket.on("update", function (update) {
        detectmessage("update", update);
    });

    socket.on("chat", function (message) {
        detectmessage("other", message);
    });

    const imageInput = document.querySelector("#imageInput");
    const imageUpload = document.querySelector("#imageUpload");

    imageUpload.addEventListener("click", () => {
        imageInput.click();
    });

    imageInput.addEventListener("change", () => {
        const f = imageInput.files[0];
        if (!f) return;
        const fr = new FileReader();
        fr.onload = () => {
            const img = new Image();
            img.onload = () => {
                const MAX_W = 800;
                const MAX_SIZE = 500 * 1024;
                let w = img.width;
                let h = img.height;
                if (w > MAX_W) {
                    h *= MAX_W / w;
                    w = MAX_W;
                }
                const cvs = document.createElement("canvas");
                cvs.width = w;
                cvs.height = h;
                const ctx = cvs.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);
                const b64 = cvs.toDataURL("image/jpeg", 0.6);
                const size = Math.ceil((b64.length - 'data:image/jpeg;base64,'.length)*3/4);
                if (size > MAX_SIZE) {
                    alert("Image too large even after compression. Try a smaller image.");
                    return;
                }
                const t = currentTime();
                detectmessage("myimage", { username: uname, image: b64, time: t });
                socket.emit("image", { username: uname, image: b64, time: t, room });
            };
            img.src = fr.result;
        };
        fr.readAsDataURL(f);
    });

    socket.on("image", (message) => {
        detectmessage("otherimage", message);
    });

    function detectmessage(type, message) {
        let message_container = app.querySelector(".chatscreen .messages");
        let element = document.createElement("div");

        if (type == "my") {
            element.setAttribute("class", "message mymessage");
            element.innerHTML = `
                <div>
                    <div class="name">You</div>
                    <div class="text">${message.text}</div>
                    <div class="time">${message.time}</div>
                </div>`;
        } else if (type == "other") {
            element.setAttribute("class", "message othermessage");
            element.innerHTML = `
                <div>
                    <div class="name">${message.username}</div>
                    <div class="text">${message.text}</div>
                    <div class="time">${message.time}</div>
                </div>`;
        } else if (type == "update") {
            element.setAttribute("class", "update");
            element.innerHTML = `<div>${message}</div>`;
        } else if (type == "myimage") {
            element.setAttribute("class", "message mymessage");
            element.innerHTML = `
            <div>
                <div class="name">You</div>
                <img src="${message.image}" style="max-width: 200px; border-radius: 10px;" />
                <div class="time">${message.time}</div>
            </div>`;
        } else if (type == "otherimage") {
            element.setAttribute("class", "message othermessage");
            element.innerHTML = `
            <div>
                <div class="name">${message.username}</div>
                <img src="${message.image}" style="max-width: 200px; border-radius: 10px;" />
                <div class="time">${message.time}</div>
            </div>`;
        }

        message_container.appendChild(element);
        message_container.scrollTop = message_container.scrollHeight - message_container.clientHeight;
    }
}

main();
