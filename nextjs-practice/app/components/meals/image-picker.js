"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import classes from "./image-picker.module.css";

const ImagePicker = ({ label, name }) => {
  const imageInput = useRef();
  const [pickedImage, setPickedImage] = useState();

  //image picker handler
  const handlePickClick = () => {
    imageInput.current.click();
  };

  //handle image change for image review on upload
  const handleImageChange = (event) => {
    const file = event.target.files[0];

    // if (!file) {
    //   setPickedImage(null);
    //   return;
    // }

    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPickedImage(fileReader.result);
    };

    fileReader.readAsDataURL(file);
  };

  return (
    <div className={classes.picker}>
      <label htmlFor={name}>{label}</label>
      <div className={classes.controls}>
        <div className={classes.preview}>
          {!pickedImage && <p>No Image Selected yet</p>}
          {pickedImage && (
            <Image src={pickedImage} alt="The image selected by user" fill />
          )}
        </div>

        <input
          className={classes.input}
          type="file"
          id={name}
          name={name}
          accept="image/jpg, image/jpeg, image/png"
          ref={imageInput}
          onChange={handleImageChange}
          required
        />
        <button
          onClick={handlePickClick}
          className={classes.button}
          type="button">
          Pick an Image
        </button>
      </div>
    </div>
  );
};

export default ImagePicker;
