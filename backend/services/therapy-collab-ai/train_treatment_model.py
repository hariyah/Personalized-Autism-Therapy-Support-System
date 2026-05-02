import argparse
import os

from treatment_recommender import train_treatment_model


def main():
    parser = argparse.ArgumentParser(description="Train the treatment suggestion recommender.")
    parser.add_argument(
        "--output-dir",
        default=os.path.join(os.path.dirname(__file__), "./models/treatment_recommender"),
        help="Directory to store the trained model artifacts."
    )
    parser.add_argument(
        "--samples-per-profile",
        type=int,
        default=120,
        help="Synthetic examples generated for each issue/urgency profile."
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducible synthetic training."
    )
    args = parser.parse_args()

    metadata = train_treatment_model(
        output_dir=os.path.abspath(args.output_dir),
        samples_per_profile=args.samples_per_profile,
        seed=args.seed
    )

    print("Treatment model training complete")
    print(f"Output directory: {os.path.abspath(args.output_dir)}")
    print(f"Training mode: {metadata['training_mode']}")
    print(f"Train size: {metadata['train_size']}")
    print(f"Test size: {metadata['test_size']}")
    print(f"Accuracy: {metadata['accuracy']:.4f}")


if __name__ == "__main__":
    main()
