import React,{useState} from "react";
import "./Apps.css";
let URL='http://localhost:5000/api/shorten';
const App=()=>{
    const[originalurl,setoriginalurl]=useState('');
    const[shorturl,setshorturl]=useState('');
    const[iserror,setiserror]=useState('');

    const handlesubmit=async(e)=>{
        e.preventDefault();
        setiserror('');
        setshorturl('');

        if(!originalurl.startsWith('http')){
            setiserror('enter valid URL');
            return;
        }
        try{
            const response= await fetch(URL,{
                method:"POST",
                headers:{
                    'content-Type':'application/json'
                },
                body:JSON.stringify({originalurl})
            });
            if(!response.ok){
                throw new Error ('failed to shorten URL');
            }
            const data  =await response.json();
            setshorturl(data.shorturl);
        }catch(error){
            console.error(error);
            setiserror('server error');
        }
    };

    return(
        <div className="App">
            <h1>URL SHORTENER</h1>
            <form onSubmit={handlesubmit}>
                <input
                type="text"
                placeholder="paste your long url"
                value={originalurl}
                onChange={(e)=>setoriginalurl(e.target.value)}
                />
                <button type="submit">shorten</button>
            </form>

            {shorturl && (
                <div className="res">
                    <p>u r shorten url:</p>
                    <a href={shorturl} target="_blank"  rel="noopener noreferrer" >{shorturl}</a>
                    </div>
            )}
            {iserror && <p className="error">{iserror}</p>}
        </div>
    )
}

export default App;