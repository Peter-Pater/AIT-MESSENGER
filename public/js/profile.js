// profile.js
document.addEventListener("DOMContentLoaded", main);

function main(){
    const apply = document.querySelector("#apply");
    apply.addEventListener("click", imgPreview);

    const submit = document.querySelector("#submit");
    const error = document.querySelector("#error");
    let success = false;
    error.style.display = "none";

    submit.addEventListener("click", function(ev){
        if (success === false){
            ev.preventDefault()
            const age = document.querySelector("#age");
            const name = document.querySelector("#name");
            const school = document.querySelector("#school");
            const location = document.querySelector("#location");
            if (age.value.length > 0 && (Number(age.value) < 0 || Number(age.value) > 150)){
                error.style.display = "block";
                error.innerHTML = "Age must be within [0, 150]";
            }else if (name.value.length > 50){
                error.style.display = "block";
                error.innerHTML = "Name must be at most 50 characters";
            }else if (school.value.length > 50){
                error.style.display = "block";
                error.innerHTML = "School must be at most 50 characters";
            }else if (location.value.length > 50){
                error.style.display = "block";
                error.innerHTML = "Location must be at most 50 characters";
            }else{
                error.style.display = "none";
                success = true;
                submit.click();
            }
        }
    });

}

function imgPreview(){
    const img = document.querySelector("#img");
    const newLink = document.querySelector("#newLink");
    if (newLink.value !== ""){
        img.src = newLink.value;
    }
}
