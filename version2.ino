//Hydra Body Machine v2: with screen and keyboard hotkeys

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
char str1[3];
String str2;

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


  // Serial.println("Initialization complete.");
}

void loop() {
  JsonDocument doc;



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
          if (str1[0] == 'A'){
                      Keyboard.printf("m");
          }
          if (str1[0] == 'L'){
            Keyboard.printf("n");
          }

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

         
      
            // modifierPin = -1;
          
        }

      }
  

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

