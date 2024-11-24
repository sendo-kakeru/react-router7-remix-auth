export async function loader (){
  return {message:'hello'}
}

export default function Page() {
  return (
    <div>
      <p>Home</p>
      <a href="/login">Login</a>
    </div>
  );
}
