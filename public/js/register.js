// register.js, mainly for form validation
document.addEventListener("DOMContentLoaded", main);

function main(){
    const submit = document.querySelector("#submit");
    const error = document.querySelector("#error");
    const line_break = document.querySelector("#break");
    let success = false;
    error.style.display = "none";
    line_break.style.display = "none";

    submit.addEventListener("click", function(ev){
        if (success === false){
            ev.preventDefault()
            const username = document.querySelector("#username");
            const password = document.querySelector("#password");
            const confirm_password = document.querySelector("#confirm_password");
            if (username.value.length === 0){
                error.style.display = "block";
                line_break.style.display = "block";
                error.innerHTML = "Username cannot be blank";
            }else if (username.value.length > 6){
                error.style.display = "block";
                line_break.style.display = "block";
                error.innerHTML = "Username must have at most 6 characters";
            }else if (password.value.length < 5){
                error.style.display = "block";
                line_break.style.display = "block";
                error.innerHTML = "Password must consist of at least 5 characters";
            }else if (confirm_password.value !== password.value){
                error.style.display = "block";
                line_break.style.display = "block";
                error.innerHTML = "Confirm password should be consistent with your password";
            }else{
                error.style.display = "none";
                line_break.style.display = "none";
                success = true;
                submit.click();
            }
        }
    });
}
