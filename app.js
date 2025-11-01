document.getElementById("ok").onclick = () => {
  document.getElementById("welcome").style.display = "none";
};

// screenshot
document.getElementById("shot").onclick = () => {
  const a = document.createElement("a");
  a.href = document.getElementById("overlay").toDataURL("image/png");
  a.download = "billiard_shot.png";
  a.click();
};

// khởi tạo camera & AI detect
document.getElementById("ai").onclick = async () => {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("overlay");
  const ctx = canvas.getContext("2d");

  const stream = await navigator.mediaDevices.getUserMedia({video:true});
  video.srcObject = stream;
  await video.play();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
  const dst = new cv.Mat();
  const cap = new cv.VideoCapture(video);
  const model = await tf.loadLayersModel("models/balls_model.json");

  async function loop(){
    cap.read(src);
    cv.cvtColor(src,dst,cv.COLOR_RGBA2BGR);
    const gray=new cv.Mat();
    cv.cvtColor(dst,gray,cv.COLOR_BGR2GRAY);
    cv.GaussianBlur(gray,gray,new cv.Size(9,9),2,2);

    const circles=new cv.Mat();
    cv.HoughCircles(gray,circles,cv.HOUGH_GRADIENT,1,20,100,30,5,40);

    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    ctx.lineWidth=2;

    for(let i=0;i<circles.cols;i++){
      const x=circles.data32F[i*3];
      const y=circles.data32F[i*3+1];
      const r=circles.data32F[i*3+2];
      const roi=tf.browser.fromPixels(video)
        .slice([Math.max(0,y-r),Math.max(0,x-r),0],[r*2,r*2,3])
        .resizeBilinear([32,32]).div(255).expandDims(0);
      const pred=await model.predict(roi).data();
      const color=pred[0]>0.5?"#fff":"#f00";
      ctx.beginPath();
      ctx.shadowBlur=8;
      ctx.shadowColor=color;
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.strokeStyle=color;
      ctx.stroke();
      ctx.closePath();
    }
    requestAnimationFrame(loop);
  }
  loop();
};