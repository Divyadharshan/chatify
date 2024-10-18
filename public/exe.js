function main(){
    const app = document.querySelector(".app");
    const socket = io();
    let uname;

    function joinchat(){
        let username = app.querySelector(".joinscreen #username").value;
        //const usernames = ["kriizh24","divyadharshan18"];
        if(username.length===0){
            alert("Username cannot be empty");
            return;
        }
        socket.emit("newuser",username);
        uname=username;
        app.querySelector(".joinscreen").classList.remove("active");
        app.querySelector(".chatscreen").classList.add("active");
    }
    
    app.querySelector(".joinscreen #joinuser").addEventListener("click",joinchat);
    app.querySelector(".joinscreen #username").addEventListener("keypress",function(k){
        if(k.key==="Enter"){
            joinchat();
        }
    });
    function currentTime(){
        const t = new Date();
        let hour = t.getHours();
        let minute = t.getMinutes();
        if(minute<10){
            minute = "0"+minute;
        }
        if(hour<10){
            hour = "0"+hour;
        }
        return hour+":"+minute;
    }
    
    function sendmessage(){
        let message = app.querySelector(".chatscreen #messageinput").value;
        if(message.length === 0){
            alert("Type something to send");
            return;
        }
        const time = currentTime();
        detectmessage("my",{
            username : uname,
            text : message,
            time : time,
        });
        socket.emit("chat",{
            username : uname,
            text : message,
            time : time,
        })
        app.querySelector(".chatscreen #messageinput").value="";
    
    }
    app.querySelector(".chatscreen #sendmessage").addEventListener("click",sendmessage);
    app.querySelector(".chatscreen #messageinput").addEventListener("keypress",function(k){
        if(k.key==="Enter"){
            sendmessage();
        }
    });

    app.querySelector(".chatscreen #exitchat").addEventListener("click",function(){
        socket.emit("exituser",uname);
        window.location.href=window.location.href;
    });
    socket.on("update",function(update){
        detectmessage("update",update);
    })
    socket.on("chat",function(message){
        detectmessage("other",message);
    })

    function detectmessage(type,message){
        let message_container = app.querySelector(".chatscreen .messages");
        let element = document.createElement("div");
        if(type == "my"){
            element.setAttribute("class","message mymessage");
            element.innerHTML = `
                 <div>
                     <div class="name">You</div>
                     <div class="text">${message.text}</div>
                     <div class="time">${message.time}</div>
                </div>`
        }
        else if(type == "other"){
            element.setAttribute("class","message othermessage");
            element.innerHTML = `
                 <div>
                     <div class="name">${message.username}</div>
                     <div class="text">${message.text}</div>
                     <div class="time">${message.time}</div>
                </div>`
        }
        else if(type=="update"){
            element.setAttribute("class","update");
            element.innerHTML = `
                          <div>
                          <div>${message}</div>
                          </div>`
        }
        message_container.appendChild(element);
        message_container.scrollTop = message_container.scrollHeight-message_container.clientHeight;
    }
}

main();