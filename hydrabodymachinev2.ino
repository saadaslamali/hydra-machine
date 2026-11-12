/*********************************************************
This is a library for the MPR121 12-channel Capacitive touch sensor

Designed specifically to work with the MPR121 Breakout in the Adafruit shop
  ----> https://www.adafruit.com/products/

These sensors use I2C communicate, at least 2 pins are required
to interface

Adafruit invests time and resources providing this open source code,
please support Adafruit and open-source hardware by purchasing
products from Adafruit!

Written by Limor Fried/Ladyada for Adafruit Industries.
BSD license, all text above must be included in any redistribution
**********************************************************/

#include <Wire.h>
#include <ArduinoJson.h>
#include "Adafruit_MPR121.h"
#include "PluggableUSBHID.h"
#include "USBKeyboard.h"
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Servo.h>
#include "Arduino_BMI270_BMM150.h"

#ifndef _BV
#define _BV(bit) (1 << (bit))
#endif




#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels

// Declaration for an SSD1306 display connected to I2C (SDA, SCL pins)
// The pins for I2C are defined by the Wire-library. 
// On an arduino UNO:       A4(SDA), A5(SCL)
// On an arduino MEGA 2560: 20(SDA), 21(SCL)
// On an arduino LEONARDO:   2(SDA),  3(SCL), ...
#define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define NUMFLAKES     10 // Number of snowflakes in the animation example

#define LOGO_HEIGHT   64
#define LOGO_WIDTH    128

Servo servo;



USBKeyboard Keyboard;

Adafruit_MPR121 cap = Adafruit_MPR121();


uint16_t lasttouched = 0;
uint16_t currtouched = 0;

int8_t modifierPin = -1;
uint8_t tapSequence[2]; 
uint8_t sequenceLength = 0;

const char pinToLetter[12] = {'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'};
char value[8];
char str1[3];
String str2;
String sendstr;

int buttonState;              // the current reading from the input pin
int buttonState1;            
int buttonState2;           
int buttonState3;            
int lastButtonState = HIGH;  // the previous reading from the input pin
int lastButtonState1 = HIGH; 
int lastButtonState2 = HIGH;  
int lastButtonState3 = HIGH; 

unsigned long lastDebounceTime = 0;  // the last time the output pin was toggled
unsigned long debounceDelay = 50;    // the debounce time; increase if the output flickers
float x, y, z;
float angleX = 0;
float angleY = 0;

char *dtostrf (double val, signed char width, unsigned char prec, char *sout) {
  char fmt[20];
  sprintf(fmt, "%%%d.%df", width, prec);
  sprintf(sout, fmt, val);
  return sout;
}

void setup() {
  Serial.begin(9600);



  while (!Serial) { 
    delay(10);
  }

  // JsonDocument doc;


  // Serial.println("Adafruit MPR121 Capacitive Touch sensor test");


  if (!cap.begin(0x5A)) {
    // Serial.println("MPR121 not found, check wiring?");
    while (1);
  }
  // Serial.println("MPR121 found!");

  // Serial.println("Running auto configuration.");
  cap.setAutoconfig(true);

  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;); // Don't proceed, loop forever
  }

  pinMode(12, INPUT_PULLUP);
  pinMode(10, INPUT_PULLUP);
  pinMode(8, INPUT_PULLUP);
  pinMode(5, INPUT_PULLUP);

  
  if (!IMU.begin()) {
    Serial.println("Failed to initialize IMU!");
    while (1);
  }
  // Serial.println("Initialization complete.");
}

void loop() {
  JsonDocument doc;

  //BUTTON LOGIC
    int reading = digitalRead(12);
  int reading1 = digitalRead(10);
  int reading2 = digitalRead(8);
  int reading3 = digitalRead(5);

  // check to see if you just pressed the button
  // (i.e. the input went from LOW to HIGH), and you've waited long enough
  // since the last press to ignore any noise:

  // If the switch changed, due to noise or pressing:
  if (reading != lastButtonState) {
    // reset the debouncing timer
    lastDebounceTime = millis();
  }

  if (reading1 != lastButtonState1) {
    // reset the debouncing timer
    lastDebounceTime = millis();
  }

  if (reading2 != lastButtonState2) {
    // reset the debouncing timer
    lastDebounceTime = millis();
  }

  if (reading3 != lastButtonState3) {
    // reset the debouncing timer
    lastDebounceTime = millis();
  }


  if ((millis() - lastDebounceTime) > debounceDelay) {
    // whatever the reading is at, it's been there for longer than the debounce
    // delay, so take it as the actual current state:

    // if the button state has changed:
    if (reading != buttonState) {
      buttonState = reading;
      // only toggle the LED if the new button state is HIGH
      if (buttonState == LOW) {
        Keyboard.printf("m");
 
      }
    }
     if (reading1 != buttonState1) {
      buttonState1 = reading1;
      // only toggle the LED if the new button state is HIGH
      if (buttonState1 == LOW) {
       while(digitalRead(10) == LOW){
                if (IMU.accelerationAvailable()) {
                  IMU.readAcceleration(x, y, z);

                  // Calculate tilt angles in degrees
                 angleY = atan2(y, sqrt(x * x + z * z)) * 2 / PI;
                  dtostrf(angleY,6,2,value);
                  // Serial.println(value);
                  sendstr = value;
                  doc["KEY"] = sendstr;
          // doc["KEY2"] = pinToLetter[i];
                    // draw_text(str1);

                  // serializeJson(doc, Serial);
                  // Serial.println();      

                   serializeJson(doc, Serial);
                  Serial.println();   
                  while (Serial.available() == 0) {}     
                  str2 = Serial.readStringUntil('\n');
                  draw_text(str2);   
                  // // Determine the tilting direction based on angleX and angleY
                  // Serial.print("Y = ");
                  // Serial.println(angleY);
                
                }
                
          }
      }
    }
     if (reading2 != buttonState2) {
      buttonState2 = reading2;
      // only toggle the LED if the new button state is HIGH
      if (buttonState2 == LOW) {
          while(digitalRead(8) == LOW){
                if (IMU.accelerationAvailable()) {
                  IMU.readAcceleration(x, y, z);

                  // Calculate tilt angles in degrees
                  angleX = (atan2(z, sqrt(y * y + x * x)) * 2 / PI);
                  

                  // // Determine the tilting direction based on angleX and angleY
                  // Serial.print("x = ");
                  // Serial.println(angleX);
                     dtostrf(angleX,6,2,value);
                    sendstr = value;
                    doc["KEY"] = sendstr;
                              // doc["KEY2"] = pinToLetter[i];
                                        // draw_text(str1);

                  serializeJson(doc, Serial);
                  Serial.println();  
                   while (Serial.available() == 0) {}     
                  str2 = Serial.readStringUntil('\n');
                  draw_text(str2);                    
                        }
                
          }
      }
    }
     if (reading3 != buttonState3) {
      buttonState3 = reading3;
      // only toggle the LED if the new button state is HIGH
      if (buttonState3 == LOW) {
        doc["KEY"] = "M";
        serializeJson(doc, Serial);
          Serial.println();  
          while (Serial.available() == 0) {}     
                  str2 = Serial.readStringUntil('\n');
                  draw_text(str2);   
          // doc["KEY2"] = pinToLetter[i];
                    // draw_text(str1);

       
      }
    }
  }

  // set the LED:

  // save the reading. Next time through the loop, it'll be the lastButtonState:
  lastButtonState = reading;
  lastButtonState1 = reading1;
  lastButtonState2 = reading2;
  lastButtonState3 = reading3;

//TOUCH LOGIC


  currtouched = cap.touched();
 
  if (modifierPin == -1){
    for (uint8_t i=0; i<12; i++){
    if ((currtouched & _BV(i)) && !(lasttouched & _BV(i))){
              modifierPin = i;
              sequenceLength = 0;
              tapSequence[sequenceLength] = i; 
              sequenceLength++;
              break; 
    }
    }
  }

  else {

   if (!(currtouched & _BV(modifierPin)) && (lasttouched & _BV(modifierPin))) {
      
    if (sequenceLength < 2){
       str1[0] = pinToLetter[modifierPin];
          str1[1] = '\0';
         doc["KEY"] = str1;
          // doc["KEY2"] = "null";


            serializeJson(doc, Serial);
      //  data.add(pinToLetter[modifierPin]);
        Serial.println();
        while (Serial.available() == 0) {}     
              str2 = Serial.readStringUntil('\n');
              draw_text(str2);
              
   }
       modifierPin = -1;
   }
  else {
   
      for (uint8_t i =0; i<12; i++)
      {
        if (i == modifierPin) continue;
        if ((currtouched & _BV(i)) && !(lasttouched & _BV(i))){
            // Serial.print(pinToLetter[modifierPin]);
            // Serial.println(pinToLetter[i]);
          str1[0] = pinToLetter[modifierPin];
          str1[1] = pinToLetter[i];
                    str1[2] = '\0';

          doc["KEY"] = str1;
          // doc["KEY2"] = pinToLetter[i];
                    // draw_text(str1);

          serializeJson(doc, Serial);
          Serial.println();
          while (Serial.available() == 0) {}     
          str2 = Serial.readStringUntil('\n');
          draw_text(str2);
            sequenceLength = 2;

                    //  

      
          
        }

      }
  
    // modifierPin = -1; 
  }

  }

  // reset our state
  lasttouched = currtouched;

  delay(10);


}

void draw_text(String x){
    display.clearDisplay();
  display.setTextSize(1);             // Normal 1:1 pixel scale
  display.setTextColor(SSD1306_WHITE);        // Draw white text
  display.setCursor(0,0);             // Start at top-left corner
  display.println(x);
    display.display();
  delay(100);
}


void testdrawchar(void) {
  display.clearDisplay();

  display.setTextSize(1);      // Normal 1:1 pixel scale
  display.setTextColor(SSD1306_WHITE); // Draw white text
  display.setCursor(0, 0);     // Start at top-left corner
  display.cp437(true);         // Use full 256 char 'Code Page 437' font

  // Not all the characters will fit on the display. This is normal.
  // Library will draw what it can and the rest will be clipped.
  for(int16_t i=0; i<256; i++) {
    if(i == '\n') display.write(' ');
    else          display.write(i);
  }

  display.display();
  delay(2000);
}

void testdrawstyles(void) {
  display.clearDisplay();

  display.setTextSize(1);             // Normal 1:1 pixel scale
  display.setTextColor(SSD1306_WHITE);        // Draw white text
  display.setCursor(0,0);             // Start at top-left corner
  display.println(F("Hello, world!"));

  display.setTextColor(SSD1306_BLACK, SSD1306_WHITE); // Draw 'inverse' text
  display.println(3.141592);

  display.setTextSize(2);             // Draw 2X-scale text
  display.setTextColor(SSD1306_WHITE);
  display.print(F("0x")); display.println(0xDEADBEEF, HEX);

  display.display();
  delay(2000);
}

void testscrolltext(void) {
  display.clearDisplay();

  display.setTextSize(2); // Draw 2X-scale text
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(10, 0);
  display.println(F("scroll"));
  display.display();      // Show initial text
  delay(100);

  // Scroll in various directions, pausing in-between:
  display.startscrollright(0x00, 0x0F);
  delay(2000);
  display.stopscroll();
  delay(1000);
  display.startscrollleft(0x00, 0x0F);
  delay(2000);
  display.stopscroll();
  delay(1000);
  display.startscrolldiagright(0x00, 0x07);
  delay(2000);
  display.startscrolldiagleft(0x00, 0x07);
  delay(2000);
  display.stopscroll();
  delay(1000);
}

